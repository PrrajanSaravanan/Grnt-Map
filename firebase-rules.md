# Firebase rules reference

Use **Firestore rules** in: Firebase Console → Firestore Database → Rules  
Use **Storage rules** in: Firebase Console → Storage → Rules  

---

## 1. Firestore (Firestore Database → Rules)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /grants/{grantId} {
      allow read: if true;
      allow write: if false;
    }

    match /applications/{applicationId} {
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
      allow read, update: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow delete: if false;
    }

    match /savedGrants/{saveId} {
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
      allow read, delete: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    match /notifications/{notificationId} {
      allow read, update: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 2. Storage (Storage → Rules)

```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

Copy the **Firestore** block into Firestore Database → Rules, then the **Storage** block into Storage → Rules, and publish each.
