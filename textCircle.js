this.Documents = new Mongo.Collection('documents');
EditingUsers = new Mongo.Collection('editingUsers');


if (Meteor.isClient) {
  Meteor.subscribe('documents');
  Meteor.subscribe('editingUsers');

  Template.editor.helpers({
    docid: function() {
      setupCurrentDocument();
      return Session.get('docid');
    },

    config: function() {
      return function(editor) {
        editor.setOption('lineNumbers', true);
        editor.setOption('theme', 'railscasts');

        editor.on('change', function(cm_editor, info) {
          $('iframe#viewer_iframe').contents().find('html').html(cm_editor.getValue());
          Meteor.call('addEditingUser');
        });
      };
    }
  });

  Template.docMeta.helpers({
    document: function() {
      return Documents.findOne({_id: Session.get('docid')});
    },

    canEdit: function() {
      return Documents.findOne({_id: Session.get('docid'), owner: Meteor.userId()});
    }
  });

  Template.navbar.helpers({
    documents: function() {
      return Documents.find();
    }
  });

  Template.editableText.helpers({
    userCanEdit: function(doc, Collection) {
      doc = Documents.findOne({_id: Session.get('docid'), owner: Meteor.userId()});

      return doc ?
              true :
              false;
    }
  });

  Template.editingUsers.helpers({
    users: function() {
      var doc, eUsers, users;
      doc = Documents.findOne();

      if (!doc) return;

      eUsers = EditingUsers.findOne({docid: doc._id});

      if (!eUsers) return;

      users = new Array();
      for (var user_id in eUsers.users)
        users.push(eUsers.users[user_id]);

      return users;
    },

    getEmail: function(emails) {
      return emails[0].address;
    }
  });

  Template.navbar.events({
    'click .js-add-doc': function(event) {
      event.preventDefault();

      if (Meteor.user()) {
        var id = Meteor.call('addDoc', function(err, res) {
          if (!err) {
            Session.set('docid', res);
          }
        });
      }
    },

    'click .js-load-doc': function(event) {
      event.preventDefault();

      Session.set('docid', this._id);
    }
  });

  Template.docMeta.events({
    'click .js-tog-private': function(event) {
      var doc = {_id: Session.get('docid'), isPrivate: event.target.checked};
      Meteor.call('updateDocPrivacy', doc);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    console.log("TextCircle started!");

    if (!Documents.findOne())
      Documents.insert({title: "My New Document"});
  });

  Meteor.publish('documents', function() {
      return Documents.find({
        $or: [
          {isPrivate: false},
          {owner: this.userId}
        ]
      });
  });

  Meteor.publish('editingUsers', function() {
    return EditingUsers.find();
  });
}

Meteor.methods({
  addEditingUser: function() {
    var doc, user, eUsers;
    doc = Documents.findOne();

    if (!doc || !this.userId) return;

    user = Meteor.user();

    eUsers = EditingUsers.findOne({docid: doc._id});

    if (!eUsers) {
        eUsers = {
          docid: doc._id,
          users: {}
        };
    }

    user.lastEdit = new Date();
    eUsers.users[this.userId] = user;

    EditingUsers.upsert({_id: eUsers._id}, eUsers);
  },

  addDoc: function() {
    var doc;
    console.log(this.userId);
    if (Meteor.userId) {
      doc = {owner: this.userId, createdOn: new Date(), title: "my new doc"};

      var id = Documents.insert(doc);
      return id;
    }
  },

  updateDocPrivacy: function(doc) {
    var realDoc = Documents.findOne({_id: doc._id, owner: this.userId});

    if (realDoc) {
      realDoc.isPrivate = doc.isPrivate;
      Documents.update({_id: doc._id}, realDoc);
    }
  }
});


// functions
function setupCurrentDocument() {
  var doc;

  if (!Session.get('docid')) {
    doc = Documents.findOne();

    if (doc)
      Session.set('docid', doc._id);
  } else {
    ;
  }
}
