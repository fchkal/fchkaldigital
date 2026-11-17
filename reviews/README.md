# Add a customer review

1. Put one approved image directly in this folder.
2. Add one object to `reviews.json`:

   ```json
   {
     "id": "replace-with-unique-id",
     "image": "customer-photo.jpg",
     "name": null,
     "game": null,
     "platform": null,
     "date": null,
     "caption": null,
     "verified": false
   }
   ```

3. Keep only details the customer approved. Set `verified` to `true` only when the purchase has been confirmed through WhatsApp.
4. Get permission before publishing and blur private details. Do not add ratings or claims the customer did not provide.
5. Run `npm run build` to generate responsive image variants and embed the review data.
