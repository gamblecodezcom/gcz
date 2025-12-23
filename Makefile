.PHONY: build up down logs api-logs restart migrate help

# Default target
help:
	@echo "GambleCodez Deployment Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  build        Build Docker images"
	@echo "  up           Start all services (detached)"
	@echo "  down         Stop all services"
	@echo "  logs         Follow logs from all services"
	@echo "  api-logs     Follow logs from API service only"
	@echo "  restart      Restart all services"
	@echo "  migrate      Run database migrations"
	@echo "  clean        Remove containers, networks, and volumes"
	@echo "  help         Show this help message"

# Build Docker images
build:
	docker-compose build

# Start services
up:
	docker-compose up -d

# Stop services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# View API logs only
api-logs:
	docker-compose logs -f api

# Restart services
restart:
	docker-compose restart

# Run database migrations
migrate:
	@echo "Running database migrations..."
	@if [ -f "001_init.sql" ]; then \
		docker-compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) < 001_init.sql || echo "Note: Using remote database, run migrations manually"; \
	fi
	@if [ -f "002_indexes.sql" ]; then \
		docker-compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) < 002_indexes.sql || echo "Note: Using remote database, run migrations manually"; \
	fi
	@if [ -f "003_seed.sql" ]; then \
		docker-compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) < 003_seed.sql || echo "Note: Using remote database, run migrations manually"; \
	fi
	@if [ -f "004_add_redirect_fields.sql" ]; then \
		docker-compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) < 004_add_redirect_fields.sql || echo "Note: Using remote database, run migrations manually"; \
	fi
	@if [ -f "005_top_pick_ads_contact.sql" ]; then \
		docker-compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) < 005_top_pick_ads_contact.sql || echo "Note: Using remote database, run migrations manually"; \
	fi
	@echo "Migrations complete (or using remote database)"

# Clean up everything
clean:
	docker-compose down -v --remove-orphans
