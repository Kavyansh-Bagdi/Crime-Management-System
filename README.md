# Crime Management System (CMS)

A comprehensive Crime Management System designed to streamline the process of reporting, tracking, and managing criminal activities. This system allows law enforcement agencies to efficiently handle crime data, ensuring quick responses and improved public safety.

## Features

- **Crime Reporting**: Users can report crimes with detailed information, including evidence and location.
- **Administrative Management**: Manage administrative users with roles, designations, and departments.
- **Crime Tracking**: View and filter crimes by status, type, and date.
- **Evidence Management**: Upload and manage evidence for crimes.
- **User Profiles**: Manage user profiles with personal details and roles.
- **Interactive Analytics**: Visualize crime trends with interactive charts.

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Node.js, Prisma, MySQL
- **Authentication**: NextAuth.js
- **State Management**: React Context API
- **Charts**: Recharts
- **Utilities**: date-fns, clsx

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL database
- npm, yarn, or pnpm package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/cms.git
   cd cms
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up the database:
   - Create a `.env` file in the root directory and add your database connection string:
     ```
     DATABASE_URL=mysql://user:password@localhost:3306/cms
     ```

4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Seed the database (optional):
   ```bash
   node prisma/data.js
   ```

### Running the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
cms/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/           # Reusable UI components
├── prisma/               # Prisma schema and seed data
├── public/               # Static assets
├── README.md             # Project documentation
└── package.json          # Project dependencies and scripts
```

## Key Features

### Crime Reporting

- Users can report crimes with details such as:
  - Title
  - Type (e.g., Theft, Assault)
  - Description
  - Date and location
  - Evidence (images, videos, etc.)

### Administrative Management

- Manage administrative users with:
  - Badge numbers
  - Designations (e.g., Officer, Detective)
  - Departments (e.g., Homicide, CyberCrime)

### Evidence Management

- Upload and manage evidence for crimes.
- View evidence details and associated metadata.

### Analytics

- Interactive charts to visualize crime trends over time.
- Filter data by time range (e.g., last 7 days, 30 days).

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/). Follow the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please contact [your-email@example.com].
