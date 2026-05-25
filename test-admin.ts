import * as admin from 'firebase-admin';

try {
  admin.initializeApp();
  console.log("Firebase Admin initialized successfully with ADC.");
} catch (e) {
  console.log("Firebase Admin failed with ADC.", e);
}
