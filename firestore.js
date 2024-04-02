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
      // allow anyone to join a game as long as we don't have two players already
      allow read: if true; // !hasTwoPlayers();
      // restrict deleting game to players of game
      allow delete: if isPlayerOfGame();
      
      // allow anyone to create a game but only with valid data
      allow create: if isCreateDataValid()
      	&& hasTimestamp();
        // && isBelowMaxNumberOfGames();
			
      // allow whoever's turn it is to update a game
      allow write: if isTurnValid() && isWriteDataValid() && isCalm();
      
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
        return request.time > resource.data.timestamp + duration.value(10, 's');
      }
      
      function isBelowMaxNumberOfGames() {
      	// https://fireship.io/lessons/how-to-rate-limit-writes-firestore/
      	let maxGames = 3;
      	return get(
      		/databases/$(database)/documents/gameCount/pZ1NqlsNlQeXocIECtvA
      	).data.gameCount <= maxGames;
      }
      
      function isCreateDataValid() {
        return onlyAllowedFieldsArePresentForCreate()
        	&& request.resource.data.id is string
        	&& request.resource.data.timestamp is timestamp
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
        let allowedFields = ['id', 'timestamp', 'player1Uid', 'player1Pieces', 'player2Pieces', 'whoseTurn', 'gameBoard', 'bagOfPieces'];
        // ensure no extra fields are added
        return request.resource.data.keys().size() == allowedFields.size()
          && request.resource.data.keys().hasAll(allowedFields);
      }

			function onlyAllowedFieldsArePresentForWrite() {
        let allowedFields = [/*'id', 'timestamp', 'player1Uid',*/ 'player1Pieces', 'player2Pieces', 'whoseTurn', 'gameBoard', 'bagOfPieces'];
        let allowedFieldsPlayer2Uid = [/*'id', 'timestamp', 'player1Uid',*/ 'player2Uid', 'player1Pieces', 'player2Pieces', 'whoseTurn', 'gameBoard', 'bagOfPieces'];
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
