# Firebase setup

The site uses Firebase Authentication for admin sign-in and Cloud Firestore for blog posts and contact messages. Firebase's web configuration is public; security comes from the Firestore rules and the admin allowlist, not from hiding the API key.

1. In Firebase Console for project `myproject-a3b32`, enable **Authentication → Email/Password** and create a Cloud Firestore database.
2. Website signup creates Firebase Authentication accounts and sends email verification. `yhussin757@gmail.com` can sign up on the website, verify the email, and then use the admin page. If this email already has an account, sign in to receive a verification link if needed.
3. Creating an account does not grant admin access. Other admins can be allowlisted by adding an empty `admins/{UID}` document from the Firebase Console or a trusted server.
4. Publish the contents of `firestore.rules` in **Firestore Database → Rules**. This allows the verified `yhussin757@gmail.com` account, or users in the UID allowlist, to manage posts and messages.
5. Serve this folder over `http://localhost` or HTTPS. ES modules and Firebase do not run correctly when the site is opened directly as a `file://` page.

The public contact form creates documents in `messages`. Only an allowlisted admin can read, update, or delete them. Blog documents are stored in `posts`; published posts are public-readable, and all post management requires admin access.