rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // match any document in the 'games' collection
    match /games/{gameId} {
      // allow anyone to join a game
      allow read: if true;
      
      // allow anyone to create or update a game but only with valid data
      allow create, write: if isDataValid();
      
      function isDataValid() {
        return onlyAllowedFieldsArePresent()
        	&& request.resource.data.id is string
        	&& request.resource.data.createdAt is timestamp
        	&& request.resource.data.players is list
        	&& request.resource.data.whoseTurn is string
        	&& request.resource.data.gameBoard is string
          && request.resource.data.gameBoard.size() == 15*15;
      }

			function onlyAllowedFieldsArePresent() {
        let allowedFields = ['id', 'createdAt', 'players', 'whoseTurn', 'gameBoard'];
        // ensure no extra fields are added
        return request.resource.data.keys().size() == allowedFields.size()
          && request.resource.data.keys().hasAll(allowedFields);
      }
    }
  }
}
