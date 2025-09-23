// database/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyDima8BFpllstKpkbC1OEZa9LaUoX-NQ0s",
  authDomain: "godk1-f7c2a.firebaseapp.com",
  databaseURL: "https://godk1-f7c2a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "godk1-f7c2a",
  storageBucket: "godk1-f7c2a.firebasestorage.app",
  messagingSenderId: "792104405808",
  appId: "1:792104405808:web:3499a43d1c65098aeed6f5"
};


export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);


export const rtdb = getDatabase(
  firebaseApp,
  "https://godk1-f7c2a-default-rtdb.europe-west1.firebasedatabase.app/"
);
