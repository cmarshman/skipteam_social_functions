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

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    else return false
}

const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

app.post('/signup', (req, res) => {
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle,
	}
    
    let errors = {};

    if(isEmpty(newUser.email)) {
        errors.email = 'Email must not be empty'
    }  else if(!isEmail(newUser.email)){
        errors.email = 'Must be an valid email address'
    }

    if(isEmpty(newUser.password)) errors.password = 'Must not be empty'
    if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match'
    if(isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

    if(Object.keys(errors).length > 0) return res.status(400).json(errors);

    //TODO validate date
    
    let token, userId;
    db.doc(`/user/${newUser.handle}`)
        .get()
		.then((doc) => {
			if(doc.exists){
				return res.status(400).json({ handle: 'this handle is already taken'})
			} else {
				return firebase
				.auth()
				.createUserWithEmailAndPassword(newUser.email, newUser.password)
			}
		})
		.then((data) => {
            userId = data.user.uid
			return data.user.getIdToken();

		})
		.then((idToken) => {
            token = idToken; 
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({ token })
        })
        .catch((err) => {
            console.error(err);
            if(err.code === 'auth/email-already-in-use'){
                return res.status(400).json({ email: 'Email is already in use'})
            } else {
                return res.status(500).json({ error: err.code });
            }
            
        })

});

exports.api = functions.region('us-east1').https.onRequest(app);
