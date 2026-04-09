import admin from "firebase-admin";
import serviceAccount from "../../secure/serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      serviceAccount as admin.ServiceAccount
    ),
  });
}

export const adminDB = admin.firestore();
