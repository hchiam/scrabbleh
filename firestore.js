rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // This rule allows anyone with your Firestore database reference to view, edit,
    // and delete all data in your Firestore database. It is useful for getting
    // started, but it is configured to expire after 30 days because it
    // leaves your app open to attackers. At that time, all client
    // requests to your Firestore database will be denied.
    //
    // Make sure to write security rules for your app before that time, or else
    // all client requests to your Firestore database will be denied until you Update
    // your rules
    // match /{document=**} {
    //   allow read, write: if request.time < timestamp.date(2024, 4, 28);
    // }

    // Match any document in the 'games' collection
    match /games/{gameId} {
      // Allow read and write access if the gameId matches the room code provided by the user
      // The assumption here is that the gameId in the URL path is the room code
      allow read, write: if request.auth != null && isValidRoomCode(gameId);

      // Example function to check if the room code (gameId) is valid
      // This is a placeholder and needs to be replaced with actual logic
      // Firestore rules do not support custom functions like this without an external check.
      // This line is to illustrate the concept and should not be used as is.
      function isValidRoomCode(gameId) {
        return true; // Implement logic to verify gameId/room code if possible
      }
    }
  }
}