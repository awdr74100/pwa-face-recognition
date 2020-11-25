import firebase from 'firebase/app';
import 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDMxDRyWekci_kwdVrKojtho91YmMALrI0',
  authDomain: 'face-recognition-db-68b3f.firebaseapp.com',
  databaseURL: 'https://face-recognition-db-68b3f.firebaseio.com',
  projectId: 'face-recognition-db-68b3f',
  storageBucket: 'face-recognition-db-68b3f.appspot.com',
  messagingSenderId: '217981948854',
  appId: '1:217981948854:web:47f61a6b3bfac02ecaa717',
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

export default db;
