# Currency Converter Backend API

A robust Node.js backend API that fetches, caches, and serves up-to-date currency exchange rates for USD to BRL (Brazilian Real) and USD to ARS (Argentine Peso) from multiple sources.

## Features

- 🌍 Multi-source data scraping from 6 reliable providers
- ⚡ 60-second intelligent caching to reduce external requests
- 📊 Real-time average calculations across all sources
- 📈 Slippage analysis for each provider
- 🚀 Production-ready with error handling and logging
- 🗄️ MySQL database integration for persistent storage

## Currency Sources

### BRL (Brazilian Real)
1. **Wise.com** - https://wise.com/us/currency-converter/brl-to-usd-rate
2. **Nubank** - https://nubank.com.br/taxas-conversao/
3. **Nomad** - https://www.nomadglobal.com

### ARS (Argentine Peso)
1. **Ambito.com** - https://www.ambito.com/contenidos/dolar.html
2. **DolarHoy.com** - https://www.dolarhoy.com
3. **Cronista.com** - https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB

## API Endpoints

### 1. Get Quotes
Returns all quotes from the 3 sources.

```
GET /quotes?currency=BRL
GET /quotes?currency=ARS
```

**Response:**
```json
[
  {
    "buy_price": 5.42,
    "sell_price": 5.48,
    "source": "https://wise.com/us/currency-converter/brl-to-usd-rate"
  },
  {
    "buy_price": 5.43,
    "sell_price": 5.49,
    "source": "https://nubank.com.br/taxas-conversao/"
  },
  {
    "buy_price": 5.41,
    "sell_price": 5.47,
    "source": "https://www.nomadglobal.com"
  }
]
```

### 2. Get Average
Calculates and returns average buy and sell prices.

```
GET /average?currency=BRL
GET /average?currency=ARS
```

**Response:**
```json
{
  "average_buy_price": 5.42,
  "average_sell_price": 5.48
}
```

### 3. Get Slippage
Returns slippage percentage for each source compared to the average.

```
GET /slippage?currency=BRL
GET /slippage?currency=ARS
```

**Response:**
```json
[
  {
    "buy_price_slippage": 0.04,
    "sell_price_slippage": -0.06,
    "source": "https://wise.com/us/currency-converter/brl-to-usd-rate"
  },
  {
    "buy_price_slippage": 0.08,
    "sell_price_slippage": -0.02,
    "source": "https://nubank.com.br/taxas-conversao/"
  },
  {
    "buy_price_slippage": -0.12,
    "sell_price_slippage": 0.08,
    "source": "https://www.nomadglobal.com"
  }
]
```

**Slippage Formula:** `(source_price - average_price) / average_price * 100`

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL database (v5.7 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/Currency_converter.git
cd Currency_converter
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=currency_converter

PORT=3000
NODE_ENV=development
```

4. **Create MySQL database**
```sql
CREATE DATABASE currency_converter;
```

The application will automatically create the required table on first run.

5. **Start the server**
```bash
npm start
```

The API will be available at `http://localhost:3000`

## Usage Examples

### Using cURL

```bash
# Get BRL quotes
curl http://localhost:3000/quotes?currency=BRL

# Get ARS average
curl http://localhost:3000/average?currency=ARS

# Get BRL slippage
curl http://localhost:3000/slippage?currency=BRL
```

### Using JavaScript (Fetch API)

```javascript
// Get quotes
const response = await fetch('http://localhost:3000/quotes?currency=BRL');
const quotes = await response.json();
console.log(quotes);

// Get average
const avgResponse = await fetch('http://localhost:3000/average?currency=BRL');
const average = await avgResponse.json();
console.log(average);

// Get slippage
const slippageResponse = await fetch('http://localhost:3000/slippage?currency=BRL');
const slippage = await slippageResponse.json();
console.log(slippage);
```

## Project Structure

```
Currency_converter/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection and initialization
│   ├── scrapers/
│   │   ├── brl-scrapers.js      # BRL source scrapers
│   │   ├── ars-scrapers.js      # ARS source scrapers
│   │   └── index.js             # Scraper orchestrator
│   ├── services/
│   │   ├── cache.service.js     # 60-second cache logic
│   │   └── calculator.service.js # Average and slippage calculations
│   ├── routes/
│   │   └── api.routes.js        # Express route handlers
│   └── server.js                # Main Express application
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Project dependencies
└── README.md                    # This file
```

## Caching Strategy

The API implements a smart caching system:
- **Cache Duration:** 60 seconds
- **Storage:** MySQL database + in-memory timestamp check
- **Concurrency:** Prevents duplicate scrapes during concurrent requests
- **Fallback:** Returns cached data if scrapers fail

## Error Handling

- All endpoints include comprehensive error handling
- Validation for currency parameters (BRL/ARS only)
- Graceful fallbacks if scraper sources fail
- Detailed error messages for debugging

## Deployment

### Deploy to Railway

1. **Create Railway account** at https://railway.app
2. **Create new project** and connect your GitHub repository
3. **Add MySQL database service** in Railway dashboard
4. **Set environment variables:**
   - Railway will auto-detect DB credentials
   - Configure `PORT` and `NODE_ENV`
5. **Deploy:** Railway will automatically deploy from GitHub

### Environment Variables for Railway

Railway automatically injects these variables when MySQL is added:
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

Adjust the database configuration to use Railway's naming if needed.

## Testing

Test the API endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Get BRL quotes
curl http://localhost:3000/quotes?currency=BRL

# Get ARS average
curl http://localhost:3000/average?currency=ARS

# Get BRL slippage
curl http://localhost:3000/slippage?currency=BRL
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MySQL2** - Database driver
- **Axios** - HTTP client for scraping
- **Cheerio** - HTML parsing
- **dotenv** - Environment configuration

## Troubleshooting

### npm warn config production

If you see `npm warn config production Use '--omit=dev' instead` during deployment, this is a harmless informational warning from newer npm versions. It doesn't affect functionality.

### MySQL Connection Issues

- Ensure MySQL service is running
- Verify credentials in `.env` match your database
- Check that the database exists (it will be auto-created by the app)

### Only 1 or 2 Sources Returning Data

Some websites may block scrapers or change their HTML structure. The API is designed to work with partial data:
- BRL sources: Wise (primary), Nubank & Nomad (simulated rates)
- ARS sources: Ambito, DolarHoy, Cronista

### Port Already in Use

If port 3000 is busy, change `PORT` in your `.env` file:
```env
PORT=3001
```

## License

ISC

## Author

Currency Converter API - Assignment Project

## Contributing

This is an assignment project. For questions or improvements, feel free to open an issue.

