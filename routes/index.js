var express = require('express');
var router = express.Router();
var context_array= [];
var number = 0;

/**** CONVERSATION ****/
router.get('/', function(req, res, next) {
    res.io.on('connection', function(socket){
        console.log('Connexion effectuée');
        socket.on('new_message', function(msg){
            //console.log('Le message: ' + msg);
            //res.io.emit('new_message', msg);
            if(!conversation) {
                res.send("Pas de conversation...");
                return;
            }
            conversation.message({
                input: { text: msg },
                workspace_id: '00bcde6f-43d6-4f33-ac34-caa4f7a1a44e',
                context : context_array[context_array.length-1]
            }, function(err, response) {
                if (err) {
                   console.error(err);
               } else {
                   context_array[number] = response.context;
                   number++;
                   //console.log(response);
                   //console.log(response.output);
                   //console.log(response.output.text);
                   res.io.emit('new_message', response.output.text);
                   //console.log('response done');
               }
           });
        });
        socket.on('disconnect', function(msg){
            console.log('Déconnexion effectuée' + socket.id);
        });
    });
    res.render('index');
});
/**** CONVERSATION ****/

router.get('/display_actor', function(req, res, next) {
  res.render('display_actor');
});

router.get('/register_actor', function(req, res, next) {
  res.render('register_actor');
});

/**** CLOUDANT  ****/
router.post('/register_actor', function(req, res, next) {
  var userName = req.body.name;
  var id = req.body.id;
  //console.log(mydb);
  if(!mydb) {
    res.send("Pas de database...");
    return;
  }
  mydb.insert({ "name" : userName, "id" : id }, function(err, body, header) {
    if (err) {
      return null; res.send('[mydb.insert] ', err.message);
    }
    res.send("Nouvelle entrée dans la base de donnée :)");
  });
});

router.get('/get_actor', function(req, res, next) {
  var data = [];
  if(!mydb) {
    res.json(data);
    return;
  }

  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(row.doc.name && row.doc.id)
        data.push({id: row.doc.id, name: row.doc.name, id_cloudant : row.doc._id});
      });
      res.json(data);
    }
  });
});

router.delete('/get_actor', function(req, res, next) {
  var id = req.body.id_cloudant;

  var query = { selector: { _id: id}};
  mydb.find(query, function(err, data) {
    if(!err) {
      console.log(data,data.docs, data.docs[0], data.docs[0]["_rev"]);
      mydb.destroy(id, data.docs[0]["_rev"],function(err, body, header) {
        if (!err) {
          console.log("Element supprimé avec success", id);
        }
        res.json(id);
      });
    }
  });

});
/**** CLOUDANT ****/

module.exports = router;
