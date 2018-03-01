var config = {
  // Upload Your Credentials Here
};
firebase.initializeApp(config);
var fs=firebase.firestore();
var db=firebase.database();

//Sign UP Function
function signup() {
  var name = document.getElementById("name").value;
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  var college_name = document.getElementById("college_name").value;
  var phoneNumber = document.getElementById("phone").value;
  console.log(name+" "+email+" "+password+" "+phoneNumber+" "+college_name);
  firebase.auth().createUserWithEmailAndPassword(email, password).then(function(user) {
    firebase.firestore().collection("UsersUID").doc(user.uid).set({
                Name : name,
                email: email,
                college_name: college_name,
                phoneNumber: phoneNumber,
                Engine: 0,
                Vehicle_Structure : 0,
                Seat_Assembly: 0,
                Tyres:0,
                Brakes: 0,
                ElectricalWiring: 0,
                Balance: 0
            })
            firebase.database().ref('users/' + user.uid).set({
              status: "true"
            })
            .then(function() {
              console.log("reached  "+user.uid);
              window.location.href = "main.html";
            })
            .catch(function(error) {
                console.error("Error writing document: ", error);
            });

  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorMessage);
    console.log(errorCode);
    // ...
  });
}

//Login Function
function login() {
  var email = document.getElementById('lemail').value;
  var password = document.getElementById('lpassword').value;

  console.log(email + password);

  firebase.auth().signInWithEmailAndPassword(email, password).then(function(){

      window.location.href = "main.html";

  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode);
    // ...
  });
}
var uid;
var statusRef;
//Auth Change Listener
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    statusRef=db.ref("users/"+user.uid+"/status");
		uid=user.uid;
		db.ref("users/"+user.uid+"/status").set("true");
		statusRef.onDisconnect().set("false");

    firebase.firestore().collection("ongoing").doc(user.uid).onSnapshot(function(snap){
        if (snap.exists && !snap.metadata.hasPendingWrites) {
          window.location = "betting.html";
        } else {
          console.log("not yet");
        }
    });

    var userRef = firebase.firestore().collection("UsersUID").doc(user.uid);
    userRef.onSnapshot(function(doc) {
      document.getElementById('disp_name').innerHTML = `${doc.data().Name}`;
      document.getElementById('balance').innerHTML = `${doc.data().Balance}`;
    });


    firebase.database().ref('/request/' + uid).once('value').
      then(function(snapshot) {
        var t=0;
        snapshot.forEach(function(childSnapshot) {
          var id_ = childSnapshot.key;
          childSnapshot.forEach(function(test){
            if(test.val() == 'sent'){
              t=1;
            }
          });
          if(t == 0){
          firebase.firestore().collection("UsersUID").doc(id_).onSnapshot(function(student) {
            $("#notification_container").append("<li class='pointer list-group-item'>" + student.data().Name + "<button onClick='acceptRequest(\"" + id_ +"\")' type='button' name='button' class='btn btn-success' >Accept</button>"+
        "<button onClick='cancelRequest(\"" + id_ +"\")' type='button' name='button' class='btn btn-danger' >Decline</button></li>");
      }); }
          });
        }).catch(error => {
          console.log(error.message);
          });
  }
  else {
    window.location.href = "login.html";
  }
});

//notification




fs.collection("UsersUID").get().then(function(querySnapshot){

  		querySnapshot.forEach(function(doc){


          firebase.database().ref('/users/' + doc.id).once('value')
          .then(function(snapshot) {

              if (snapshot.val().status == "true" && doc.id != uid ) {
                  $("#users").append("<li class='list-group-item'>" + doc.data().Name +
                                                    "<button onClick='sendRequest(\"" + doc.id +"\")' style='float: right;' class='mdl-button mdl-js-button mdl-button--icon mdl-button--colored'>"+
                                                    "<i class='material-icons'>add</i></button></li>");
              }

          })
          .catch(error => {
                console.log(error.message);
          });

  		});

});

  		/*db.ref('users').on('value',function(snapshot) {
  		  $(".status").remove();
		  var data=snapshot.val();
		  var keys=Object.keys(data);
		  for(i=0;i<keys.length;i++){
		  	var k=keys[i];
		  	if (data[k].status=="true") {
		  		$("#"+k).append(" <span class='status' >Online</span>");
		  	}else{
		  		$("#"+k).append(" <span class='status' >Offline</span>");
		  	}
		  }
		});*/

function sendRequest(id) {

  console.log("my uid - " + uid);

  var updates = {};
  updates['/request/' + uid + "/" + id] = {type: 'sent'};
  updates['/request/' + id + '/' + uid] = {type: 'received'};

  firebase.database().ref().update(updates, function(error) {
    if (error) {
      alert("Data could not be saved." + error);
    } else {
      alert("Data saved successfully.");
    }
  });

}

function acceptRequest(other_id) {
    var updates = {};
    updates['/request/' + uid + "/" + other_id] = null;
    updates['/request/' + other_id + '/' + uid] = null;

  firebase.database().ref().update(updates, function(error) {
    if (error) {
      alert("Data could not be saved." + error);
    } else {

      console.log(other_id + uid);

      var batch = firebase.firestore().batch();
      batch.set(firebase.firestore().collection("ongoing").doc(other_id), {with_uid: uid});
      batch.set(firebase.firestore().collection("ongoing").doc(uid), {with_uid: other_id});

      batch.commit().then(function() {
          window.location.href = "betting.html";
          console.log("done");
      }).catch(function(error) {
          console.log("Error writing document: ", error.message);
      });

    }
  });
}

function cancelRequest(other_id) {
    var updates = {};
    updates['/request/' + uid + "/" + other_id] = null;
    updates['/request/' + other_id + '/' + uid] = null;

  firebase.database().ref().update(updates, function(error) {
    if (error) {
      alert("Data could not be saved." + error);
    } else {
      alert("Data saved successfully.");
      return;
    }
  });
}


//Event Listener of Logout
function logout() {
firebase.auth().signOut().then(function() {
  db.ref("users/"+uid+"/status").set("false");
  // Sign-out successful.
  //window.location.href = "login.html"
  }).catch(function(error) {
    // An error happened.
  });
}
