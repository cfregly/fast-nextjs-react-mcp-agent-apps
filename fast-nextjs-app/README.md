This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Configure the OPENAI API Key

Create and update the `.env` file at the root of the code base.
```
NEXT_PUBLIC_OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```
## Start the Server
1. install dependencies
```bash
npm install
```

2. run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

# Usage

1. Enter a travel destination (city, country, landmark, etc).
2. Save the itinerary.
3. Repeat.
4. Refresh the browser (or use incognito mode) to ensure that I'm actually persisting the data (though not in a real database).

# Areas of Improvement
Next steps would include the following:
* wire up authorization (Kinde or equivalent)
* add real persistence with a real database (prism, mysql, or equivalents)
* add delete functionality for saved itineraries
* paginate saved itineraries
