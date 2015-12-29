this.Documents = new Mongo.Collection('documents');
EditingUsers = new Mongo.Collection('editingUsers');


if (Meteor.isClient) {
  Template.editor.helpers({
    docid: function() {
      var doc = Documents.findOne();

      if (doc)
        return doc._id;
      else
        return undefined;
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

      console.log(users);
      return users;
    },

    getEmail: function(emails) {
      return emails[0].address;
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    console.log("TextCircle started!");

    if (!Documents.findOne())
      Documents.insert({title: "My New Document"});
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
  }
});
