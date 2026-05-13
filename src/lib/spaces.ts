import { db } from '@/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  runTransaction
} from 'firebase/firestore';

/**
 * Create a new space with memberIds denormalization
 */
export async function createSpace(
  userId: string,
  email: string,
  displayName: string,
  spaceName: string,
  spaceType: 'personal' | 'shared'
) {
  const spaceRef = await addDoc(collection(db, 'spaces'), {
    name: spaceName,
    type: spaceType,
    ownerId: userId,
    memberIds: [userId], // Denormalized member list
    createdAt: serverTimestamp(),
  });

  // Still maintain members subcollection for detailed info
  await setDoc(doc(db, `spaces/${spaceRef.id}/members`, userId), {
    userId,
    email,
    displayName,
    role: 'admin',
    spaceOwnerId: userId,
    joinedAt: serverTimestamp(),
  });

  return spaceRef.id;
}

/**
 * Add a member to a space (updates both memberIds and members subcollection)
 */
export async function addSpaceMember(
  spaceId: string,
  userId: string,
  email: string,
  displayName: string,
  role: 'admin' | 'member' = 'member'
) {
  const spaceRef = doc(db, 'spaces', spaceId);
  const spaceSnap = await getDoc(spaceRef);
  
  if (!spaceSnap.exists()) {
    throw new Error('Space not found');
  }

  // Update memberIds array
  await updateDoc(spaceRef, {
    memberIds: arrayUnion(userId)
  });

  // Add member document
  await setDoc(doc(db, `spaces/${spaceId}/members`, userId), {
    userId,
    email,
    displayName,
    role,
    spaceOwnerId: spaceSnap.data().ownerId,
    joinedAt: serverTimestamp(),
  });
}

/**
 * Remove a member from a space
 */
export async function removeSpaceMember(spaceId: string, userId: string) {
  const spaceRef = doc(db, 'spaces', spaceId);
  
  // Remove from memberIds array
  await updateDoc(spaceRef, {
    memberIds: arrayRemove(userId)
  });

  // Delete member document
  await deleteDoc(doc(db, `spaces/${spaceId}/members`, userId));
}

/**
 * Get all spaces where user is a member (using memberIds query)
 */
export async function getUserSpaces(userId: string) {
  const q = query(
    collection(db, 'spaces'),
    where('memberIds', 'array-contains', userId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Accept invite link with transaction to prevent race conditions
 */
export async function acceptInviteLink(
  tokenId: string,
  userId: string,
  email: string,
  displayName: string
): Promise<{ spaceId: string; spaceName: string }> {
  return await runTransaction(db, async (transaction) => {
    const tokenRef = doc(db, 'inviteLinks', tokenId);
    const tokenSnap = await transaction.get(tokenRef);

    if (!tokenSnap.exists()) {
      throw new Error('Invite link not found');
    }

    const tokenData = tokenSnap.data();

    if (tokenData.used) {
      throw new Error('Invite link already used');
    }

    const { spaceId, spaceName } = tokenData;
    const spaceRef = doc(db, 'spaces', spaceId);
    const spaceSnap = await transaction.get(spaceRef);

    if (!spaceSnap.exists()) {
      throw new Error('Space not found');
    }

    // Update space memberIds
    transaction.update(spaceRef, {
      memberIds: arrayUnion(userId)
    });

    // Add member document
    const memberRef = doc(db, `spaces/${spaceId}/members`, userId);
    transaction.set(memberRef, {
      userId,
      email,
      displayName,
      role: 'member',
      spaceOwnerId: spaceSnap.data().ownerId,
      joinedAt: serverTimestamp(),
    });

    // Mark token as used
    transaction.update(tokenRef, {
      used: true,
      usedBy: userId,
      usedAt: serverTimestamp()
    });

    return { spaceId, spaceName };
  });
}
