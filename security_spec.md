# Firebase Security Specification

## Data Invariants
1. A user can only read/write their own profile in `/users/{userId}`.
2. A user can only read/write their own saves in `/users/{userId}/private/saves`.
3. Anyone can read `/leaderboard`, but only the owner can write their own entry.
4. Leaderboard scores must be positive numbers.
5. Usernames must be strings under 50 characters.

## The "Dirty Dozen" Payloads (Denial Tests)
1. Write to another user's profile.
2. Update `uid` field in user profile (immutability).
3. Update `score` in leaderboard to a lower value (handled by app logic, but rules should prevent spoofing userId).
4. Inject a 1MB string into `username`.
5. Access `/users/{userId}/private/saves` of another user.
6. Write to `/leaderboard` without a valid `wave` field.
7. Write to `/leaderboard` with a `score` that is a string instead of a number.
8. Delete the `/leaderboard` collection (blanket delete).
9. Update `createdAt` in leaderboard entry.
10. Write a profile with a `uid` that doesn't match `request.auth.uid`.
11. Write a save with a `userId` that doesn't match `request.auth.uid`.
12. Use a non-alphanumeric ID for a user.
