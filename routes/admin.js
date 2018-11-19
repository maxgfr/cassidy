var express = require('express');
var router = express.Router();
var context_array= [];
var number = 0;

router.get('/', function(req, res, next) {
  res.render('admin/index');
});

router.get('/add', function(req, res, next) {
  res.render('admin/add');
});

/**** CLOUDANT  ****/
router.post('/add', function(req, res, next) {
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

router.get('/', function(req, res, next) {
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

router.delete('/', function(req, res, next) {
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
