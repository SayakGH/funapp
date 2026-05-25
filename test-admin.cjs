const admin = require('firebase-admin');

async function test() {
  try {
    admin.initializeApp();
    const db = admin.firestore();
    db.settings({ databaseId: 'ai-studio-7c17152c-fdc1-4b05-9ef6-0782f45eb039' });
    await db.collection('test').doc('test').set({ hello: 'world' });
    console.log("Write successful!");
    
    // Test delete
    await db.collection('test').doc('test').delete();
    console.log("Delete successful!");
  } catch (e) {
    console.log("Failed to write to DB.", e);
  }
}
test();
