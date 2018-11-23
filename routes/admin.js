var express = require('express');
var router = express.Router();
var context_array= [];
var number = 0;

router.get('/', function(req, res, next) {
  res.render('admin/index');
});

router.get('/get_model', function(req, res, next) {
  var data = [];
  if(!mydb) {
    res.json(data);
    return;
  }
  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(!row.doc.inventary || row.doc.inventary == false)
          data.push({id_cloudant : row.doc._id, prix: row.doc.prix, delai: row.doc.delai, modele: row.doc.modele, energie: row.doc.energie, bv: row.doc.bv, usage: row.doc.usage, confort: row.doc.confort, esthetique: row.doc.esthetique, assistance: row.doc.assistance, multimedia: row.doc.multimedia});
      });
      res.json(data);
    } else {
      console.log(err);
    }
  });
});

router.get('/inventary', function(req, res, next) {
  res.render('admin/inventary');
});

router.get('/get_model_inventary', function(req, res, next) {
  var data = [];
  if(!mydb) {
    res.json(data);
    return;
  }
  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(row.doc.inventary || row.doc.inventary == true)
          data.push({id_cloudant : row.doc._id, prix: row.doc.prix, delai: row.doc.delai, modele: row.doc.modele, energie: row.doc.energie, bv: row.doc.bv, usage: row.doc.usage, confort: row.doc.confort, esthetique: row.doc.esthetique, assistance: row.doc.assistance, multimedia: row.doc.multimedia});
      });
      res.json(data);
    } else {
      console.log(err);
    }
  });
});

router.delete('/', function(req, res, next) {
  var id = req.body.id_cloudant;
  var query = { selector: { _id: id}};
  mydb.find(query, function(err, data) {
    if(!err) {
      //console.log(data,data.docs, data.docs[0], data.docs[0]["_rev"]);
      mydb.destroy(id, data.docs[0]["_rev"],function(err, body, header) {
        if (!err) {
          console.log("Deleted with success", id);
        }
        res.json(id);
      });
    }
  });

});

router.get('/add', function(req, res, next) {
  res.render('admin/add');
});

router.post('/add', function(req, res, next) {
  var prix = req.body.prix;
  var delai = req.body.delai;
  var modele = req.body.modele;
  var energie = req.body.energie;
  var bv = req.body.bv;
  var usage = req.body.usage;
  var confort = req.body.confort;
  var esthetique = req.body.esthetique;
  var assistance = req.body.assistance;
  var multimedia = req.body.multimedia;
  var inventary = req.body.inventary;
  //console.log(mydb);
  if(!mydb) {
    res.send("No database linked...");
    return;
  }
  mydb.insert({ "prix": prix, "delai": delai, "modele": modele, "energie": energie, "bv": bv, "usage": usage, "confort": confort, "esthetique": esthetique, "assistance": assistance, "multimedia": multimedia, "inventary": inventary }, function(err, body, header) {
    if (err) {
      return null; res.send('[mydb.insert] ', err.message);
    }
    res.send("New entry in the database");
  });
});

module.exports = router;
