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
      
      // allow anyone to create a game but only with valid data
      allow create: if isCreateDataValid();

      // allow whoever's turn it is to update a game
      allow write: if isTurnValid() && isWriteDataValid();
      
      function isCreateDataValid() {
        return onlyAllowedFieldsArePresentForCreate()
        	&& request.resource.data.id is string
        	&& request.resource.data.createdAt is timestamp
          && request.resource.data.player1Uid is string
        	&& request.resource.data.player1Pieces is string
        	&& request.resource.data.player2Pieces is string
        	&& request.resource.data.whoseTurn is string
        	&& request.resource.data.gameBoard is string
          && request.resource.data.gameBoard.size() == 15*15
          && request.resource.data.bagOfPieces is string
          && request.resource.data.bagOfPieces.size() <= 100;
      }

      function isWriteDataValid() {
        return onlyAllowedFieldsArePresentForWrite()
        	// && request.resource.data.id is string
        	// && request.resource.data.createdAt is timestamp
          // && request.resource.data.player1Uid is string
        	&& request.resource.data.player1Pieces is string
        	&& request.resource.data.player2Pieces is string
        	&& request.resource.data.whoseTurn is string
        	&& request.resource.data.gameBoard is string
          && request.resource.data.gameBoard.size() == 15*15
          && request.resource.data.bagOfPieces is string
          && request.resource.data.bagOfPieces.size() <= 100;
      }

			function onlyAllowedFieldsArePresentForCreate() {
        let allowedFields = ['id', 'createdAt', 'player1Uid', 'player1Pieces', 'player2Pieces', 'whoseTurn', 'gameBoard', 'bagOfPieces'];
        // ensure no extra fields are added
        return request.resource.data.keys().size() == allowedFields.size()
          && request.resource.data.keys().hasAll(allowedFields);
      }

			function onlyAllowedFieldsArePresentForWrite() {
        let allowedFields = [/*'id', 'createdAt', 'player1Uid',*/ 'player1Pieces', 'player2Pieces', 'whoseTurn', 'gameBoard', 'bagOfPieces'];
        let allowedFieldsPlayer2Uid = [/*'id', 'createdAt', 'player1Uid',*/ 'player2Uid', 'player1Pieces', 'player2Pieces', 'whoseTurn', 'gameBoard', 'bagOfPieces'];
        // ensure no extra fields are added
        let hasOnlyAllowedFields = // TODO:
        	// request.resource.data.keys().size() == allowedFields.size()
        	// &&
          request.resource.data.keys().hasAll(allowedFields);
        let hasOnlyAllowedFieldsPlayer2Uid = // TODO:
        	// request.resource.data.keys().size() == allowedFieldsPlayer2Uid.size()
        	// &&
          request.resource.data.keys().hasAll(allowedFieldsPlayer2Uid);
        return hasOnlyAllowedFields || hasOnlyAllowedFieldsPlayer2Uid;
      }

      function isTurnValid() {
        let gameDoc = get(/databases/$(database)/documents/games/$(gameId)).data;
        
        let isPlayer1Turn = gameDoc.whoseTurn == 'player1' && gameDoc.player1Uid == request.auth.uid;
        let isPlayer2Turn = gameDoc.whoseTurn == 'player2' && gameDoc.player2Uid == request.auth.uid;

        // prevent editing the other player's pieces
        let arePlayer1PiecesValid = isPlayer2Turn && gameDoc.player1Pieces == request.resource.data.player1Pieces;
        let arePlayer2PiecesValid = isPlayer1Turn && gameDoc.player2Pieces == request.resource.data.player2Pieces;
        
        return request.auth != null && (isPlayer1Turn || isPlayer2Turn) && (arePlayer1PiecesValid || arePlayer2PiecesValid);
      }
    }
  }
}
