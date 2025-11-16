# GraphQL Profile Page

A modern, interactive profile page that displays your school information using GraphQL queries. This project demonstrates GraphQL querying, JWT authentication, and SVG-based data visualization.

## Features

- **Login Page**: Secure authentication with JWT tokens supporting both username and email login
- **Profile Display**: Shows user information including:
  - User ID and Login
  - Total XP
  - Audit Ratio
- **Interactive Statistics**: SVG-based graphs including:
  - XP Over Time (Line Chart)
  - XP by Project (Bar Chart)
  - Pass/Fail Ratio (Pie Chart)
  - Audit Ratio (Pie Chart)
- **Modern UI**: Responsive design with beautiful gradients and animations
- **GraphQL Queries**: Demonstrates normal, nested, and argument-based queries

## Setup Instructions

### 1. Configure the Domain

Edit `js/config.js` and replace `((DOMAIN))` with your actual domain:

```javascript
GRAPHQL_ENDPOINT: 'https://your-domain.com/api/graphql-engine/v1/graphql',
SIGNIN_ENDPOINT: 'https://your-domain.com/api/auth/signin',
```

### 2. Local Development

1. Clone or download this repository
2. Open `index.html` in a web browser
3. For better development experience, use a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

### 3. Hosting

This project can be hosted on any static hosting service:

#### GitHub Pages
1. Push your code to a GitHub repository
2. Go to Settings > Pages
3. Select your branch and folder
4. Your site will be available at `https://yourusername.github.io/repository-name`

#### Netlify
1. Drag and drop the project folder to [Netlify](https://app.netlify.com/drop)
2. Or connect your GitHub repository for automatic deployments

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory

## Project Structure

```
graphql/
├── index.html          # Login page
├── profile.html        # Profile page
├── css/
│   └── styles.css      # All styling
├── js/
│   ├── config.js       # Configuration (domain endpoints)
│   ├── config.example.js # Example configuration file
│   ├── auth.js         # Authentication utilities
│   ├── login.js        # Login page logic
│   ├── graphql.js      # GraphQL query functions
│   ├── graphs.js       # SVG graph rendering
│   └── profile.js      # Profile page logic
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## GraphQL Queries Used

The project demonstrates three types of GraphQL queries:

### 1. Normal Query
```graphql
query {
  user {
    id
    login
  }
}
```

### 2. Query with Arguments
```graphql
query GetTotalXP($userId: Int!) {
  transaction(
    where: {
      userId: { _eq: $userId },
      type: { _eq: "xp" }
    }
  ) {
    amount
  }
}
```

### 3. Nested Query
```graphql
query {
  result {
    id
    user {
      id
      login
    }
  }
}
```

## Authentication Flow

1. User enters username/email and password
2. Credentials are base64 encoded and sent via Basic Authentication
3. Server returns JWT token
4. JWT is stored in localStorage
5. All GraphQL requests include JWT as Bearer token
6. User ID is extracted from JWT payload

## SVG Graphs

All graphs are rendered using pure SVG (no external charting libraries):

- **Line Chart**: XP progression over time with area fill
- **Bar Chart**: XP distribution across projects
- **Pie Charts**: Visual representation of ratios (Pass/Fail, Audit)

Graphs are interactive and responsive, adapting to container size.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Any modern browser with ES6+ support

## Security Notes

- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- All API requests use HTTPS
- Credentials are base64 encoded (not encrypted - always use HTTPS)

## Customization

### Adding New Graphs

1. Add a new function in `graphs.js` (e.g., `renderNewGraph`)
2. Add a query function in `graphql.js` to fetch the data
3. Add a button in `profile.html` with `data-graph="new-graph"`
4. Add a case in `profile.js` `renderGraph()` function

### Styling

Edit `styles.css` to customize:
- Colors (CSS variables in `:root`)
- Layout and spacing
- Animations
- Responsive breakpoints

## Troubleshooting

### CORS Errors
If you encounter CORS errors, ensure:
- The domain in `config.js` is correct
- The server allows requests from your origin
- You're using HTTPS for production

### Authentication Fails
- Verify the domain is correct
- Check that credentials are valid
- Ensure the signin endpoint is accessible

### Graphs Not Displaying
- Check browser console for errors
- Verify GraphQL queries return data
- Ensure SVG rendering is supported

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

