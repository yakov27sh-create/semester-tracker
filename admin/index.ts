import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf8"),
);

admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://diakstra-personal.firebaseio.com",
  },
  "diakstra-personal",
);

admin
  .app("diakstra-personal")
  .firestore()
  .settings({ databaseId: "diakstra-personal" });
export const db = admin.app("diakstra-personal").firestore();
console.log(db);
export const auth = admin.app("diakstra-personal").auth();
