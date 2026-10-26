// ================= FIREBASE SETUP (required for admin panel, analytics, custom ads) =================
// 1. Go to https://console.firebase.google.com -> your "nothing" project
//    -> Project settings (gear icon) -> General -> "Your apps" -> Web app.
//    If you don't have a web app yet, click "Add app" -> Web (</>) and register one.
// 2. Copy the firebaseConfig object it gives you and paste the values below.
// 3. In the left sidebar: Build -> Firestore Database -> Create database
//    -> start in "Production mode" -> pick a location -> Enable.
// 4. In the left sidebar: Build -> Authentication -> Get started
//    -> Sign-in method tab -> enable "Email/Password".
// 5. Still in Authentication -> Users tab -> "Add user" -> enter the
//    email + password YOU want to log into /admin.html with.
// 6. Deploy Firestore's security rules once (see firestore.rules in this
//    project): firebase deploy --only firestore:rules
// 7. Redeploy hosting: firebase deploy --only hosting

const firebaseConfig = {
  apiKey: "AIzaSyBK1_BKGvL0D_ROa30xBJre_b8AoujbAuc",
  authDomain: "nothing-82f21.firebaseapp.com",
  projectId: "nothing-82f21",
  storageBucket: "nothing-82f21.firebasestorage.app",
  messagingSenderId: "66857094195",
  appId: "1:66857094195:web:b4b5f991a9a3567bfea746"
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
