rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /broadcast/{messageId} {
      // allow read access to all users
      allow read: if true; // read = get, list
      // restrict write access
      allow write: if false; // write = block create, delete, update
    }
    
    // match any document in the 'games' collection
    match /games/{gameId} {
      // allow anyone to join a game // TODO: as long as we don't have two players already
      allow read: if true; // !hasTwoPlayers();
      // restrict deleting game to players of game
      allow delete: if isPlayerOfGame();
      
      // allow anyone to create a game but only with valid data
      allow create: if isCreateDataValid()
      	&& hasTimestamp();
        // && isBelowMaxNumberOfGames();
			
      // allow whoever's turn it is to update a game
      allow update: if isTurnValid()
        && isWriteDataValid()
        && isCalm();
      
      // function hasTwoPlayers() {
      // 	return resource.data.player1Uid != null
      //   	&& resource.data.player2Uid != null;
      // }
      
      function isPlayerOfGame() {
      	return (resource.data.player1Uid != null && resource.data.player1Uid == request.auth.uid)
        	|| (resource.data.player2Uid != null && resource.data.player2Uid == request.auth.uid);
      }
      
      function hasTimestamp() {
      	// https://stackoverflow.com/a/56487579
        return request.resource.data.timestamp == request.time;
      }
      
      function isCalm() {
      	// https://stackoverflow.com/a/56487579
        let secondsToWait = 10;
        return request.time > resource.data.timestamp + duration.value(secondsToWait, 's');
      }
      
      // // TODO: this doesn't work:
      // function isBelowMaxNumberOfGames() {
      // 	let maxGames = 3;
      //   // https://stackoverflow.com/a/59924063
      // 	return get(
      // 		/databases/$(database)/documents/games
      // 	).data.count <= maxGames;
      // 	// https://fireship.io/lessons/how-to-rate-limit-writes-firestore/
      // 	return get(
      // 		/databases/$(database)/documents/gameCount/pZ1NqlsNlQeXocIECtvA
      // 	).data.gameCount <= maxGames;
      // }
      
      function isCreateDataValid() {
        return onlyAllowedFieldsArePresentForCreate()
        	&& request.resource.data.id is string
        	&& request.resource.data.timestamp is timestamp
          && request.resource.data.player1Uid is string
          && request.resource.data.player2Uid is string
        	&& request.resource.data.player1Score is int
        	&& request.resource.data.player1Score == 0
        	&& request.resource.data.player2Score is int
        	&& request.resource.data.player2Score == 0
        	&& request.resource.data.player1Pieces is string
        	&& request.resource.data.player2Pieces is string
        	&& request.resource.data.whoseTurn is string
        	&& request.resource.data.gameBoard is string
          && request.resource.data.gameBoard.size() == 15*15
          && request.resource.data.bagOfPieces is string
          && request.resource.data.bagOfPieces.size() <= 100
          && request.resource.data.xy1 is string
          && request.resource.data.xy2 is string;
      }

      function isWriteDataValid() {
        return onlyAllowedFieldsArePresentForWrite()
        	&& request.resource.data.id == resource.data.id // can't change the id
        	// && request.resource.data.timestamp is timestamp
          // && request.resource.data.player1Uid is string
          // && request.resource.data.player2Uid is string
        	&& request.resource.data.player1Score is int
        	&& request.resource.data.player2Score is int
        	&& request.resource.data.player1Pieces is string
        	&& request.resource.data.player2Pieces is string
        	&& request.resource.data.whoseTurn is string
        	&& request.resource.data.gameBoard is string
          && request.resource.data.gameBoard.size() == 15*15
          && request.resource.data.bagOfPieces is string
          && request.resource.data.bagOfPieces.size() <= 100
          && request.resource.data.xy1 is string
          && request.resource.data.xy2 is string;
      }

			function onlyAllowedFieldsArePresentForCreate() {
        let allowedFields = ['id', 'timestamp', 'player1Uid', 'player2Uid', 'player1Score', 'player2Score', 'player1Pieces', 'player2Pieces', 'whoseTurn', 'gameBoard', 'bagOfPieces', 'xy1', 'xy2'];
        // ensure no extra fields are added
        return request.resource.data.keys().size() == allowedFields.size()
          && request.resource.data.keys().hasAll(allowedFields);
      }

			function onlyAllowedFieldsArePresentForWrite() {
        let allowedFields = ['id', /*'timestamp', 'player1Uid', 'player2Uid',*/ 'player1Score', 'player2Score', 'player1Pieces', 'player2Pieces', 'whoseTurn', 'gameBoard', 'bagOfPieces', 'xy1', 'xy2'];
        let allowedFields_forPlayer2UidSetup = ['id', 'player2Uid'];
        // ensure no extra fields are added
        let hasOnlyAllowedFields = // TODO:
        	// request.resource.data.keys().size() == allowedFields.size()
        	// &&
          request.resource.data.keys().hasAll(allowedFields);
        let hasOnlyAllowedFields_forPlayer2UidSetup = // TODO:
        	// request.resource.data.keys().size() == allowedFields_forPlayer2UidSetup.size()
        	// &&
          request.resource.data.keys().hasAll(allowedFields_forPlayer2UidSetup);
        return hasOnlyAllowedFields || hasOnlyAllowedFields_forPlayer2UidSetup;
      }

      function isTurnValid() {
      	let allowedFields_forPlayer2UidSetup = ['id', 'player2Uid'];
        let hasOnlyAllowedFields_forPlayer2UidSetup = // TODO:
        	// request.resource.data.keys().size() == allowedFields_forPlayer2UidSetup.size()
        	// &&
          request.resource.data.keys().hasAll(allowedFields_forPlayer2UidSetup);
        
        let gameDoc = get(/databases/$(database)/documents/games/$(gameId)).data;
        
        let isPlayer1Turn = gameDoc.whoseTurn == 'player1' && gameDoc.player1Uid == request.auth.uid;
        let isPlayer2Turn = gameDoc.whoseTurn == 'player2' && gameDoc.player2Uid == request.auth.uid;

        // prevent editing the other player's pieces
        let arePlayer1PiecesValid = isPlayer2Turn && gameDoc.player1Pieces == request.resource.data.player1Pieces;
        let arePlayer2PiecesValid = isPlayer1Turn && gameDoc.player2Pieces == request.resource.data.player2Pieces;

				let isValidTurn = (isPlayer1Turn && arePlayer1PiecesValid)
        	|| (isPlayer2Turn && arePlayer2PiecesValid);
        return request.auth != null 
        	&& (hasOnlyAllowedFields_forPlayer2UidSetup || isValidTurn);
      }
    }
  }
}
