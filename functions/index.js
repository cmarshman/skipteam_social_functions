const functions = require('firebase-functions');
const admin = require("firebase-admin");
const app = require('express')();

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://skipteam-social-24fa5.firebaseio.com"
});

const firebaseConfig = {
    apiKey: "AIzaSyBqqRuIou1ze02r8UUag5Ekj8cKCqPVN84",
    authDomain: "skipteam-social-24fa5.firebaseapp.com",
    databaseURL: "https://skipteam-social-24fa5.firebaseio.com",
    projectId: "skipteam-social-24fa5",
    storageBucket: "skipteam-social-24fa5.appspot.com",
    messagingSenderId: "242116089470",
    appId: "1:242116089470:web:05210c7385bbc955eaaa2f",
    measurementId: "G-5J0TG3PP14"
  };

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get('/screams', (req, res) => {
   db
		.collection('screams')
		.orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let screams= [];
            data.forEach((doc) => {
                screams.push({
					screamId: doc.id,
					body: doc.data().body,
					userHandle: doc.data().userHandle,
					createdAt: doc.data().createdAt
				});
            });
            return res.json(screams);
        })
        .catch((err) => console.error(err));
});

app.post('/scream', (req, res) =>{
    
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

   db
        .collection('screams')
        .add(newScream)
        .then((doc) => {
            res.json({ message: `document ${doc.id} created successfully` });
        })
        .catch((err) => {
            res.status(500).json({ error: 'something went wrong'})
        });
});

//signup route

app.post('/signup', (req, res) => {
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle,
	}

	//TODO validate date
	db.doc(`/user/${newUser.handle}`).get()
		.then(doc => {
			if(doc.exists){
				return res.status(400).json({ handle: 'this handle is already taken'})
			} else {
				return firebase
				.auth()
				.createUserWithEmailAndPassword(newUser.email, newUser.password)
			}
		})
		.then(data => {
			return data.user.getIdToken();

		})
		.then(token => {
			return res.status(201).json({ token });
		})

});

exports.api = functions.region('us-east1').https.onRequest(app);
