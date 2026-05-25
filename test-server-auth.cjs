const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const config = require('./firebase-applet-config.json');

const app = initializeApp(config);
const auth = getAuth(app);

async function authServer() {
  const email = "server@pollars.royale";
  const password = "superserverpassword123";
  try {
    const user = await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in server!", user.user.uid);
  } catch (e) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Created server user!", user.user.uid);
    } else {
      console.log("Error:", e);
    }
  }
}
authServer();
