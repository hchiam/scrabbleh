rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /broadcast/{messageId} {
      // Allow read access to all users
      allow read: if true;
      // Restrict write access
      allow write: if false;
    }
    
    // match any document in the 'games' collection
    match /games/{gameId} {
      // allow anyone to join a game or delete a game
      allow read, delete: if true;
      
      // allow anyone to create or update a game but only with valid data
      allow create, write: if isDataValid();
      
      function isDataValid() {
        return onlyAllowedFieldsArePresent()
        	&& request.resource.data.id is string
        	&& request.resource.data.createdAt is timestamp
        	&& request.resource.data.player1 is string
        	&& request.resource.data.player2 is string
        	&& request.resource.data.player1Pieces is string
        	&& request.resource.data.player2Pieces is string
        	&& request.resource.data.whoseTurn is string
        	&& request.resource.data.gameBoard is string
          && request.resource.data.gameBoard.size() == 15*15
          && request.resource.data.bagOfPieces is string
          && request.resource.data.bagOfPieces.size() <= 100;
      }

			function onlyAllowedFieldsArePresent() {
        let allowedFields = ['id', 'createdAt', 'player1', 'player2', 'player1Pieces', 'player2Pieces', 'whoseTurn', 'gameBoard', 'bagOfPieces'];
        // ensure no extra fields are added
        return request.resource.data.keys().size() == allowedFields.size()
          && request.resource.data.keys().hasAll(allowedFields);
      }
    }
  }
}
