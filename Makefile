# =========================
# 🎨 Colors
# =========================
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
RED=\033[0;31m
NC=\033[0m # No Color

.PHONY: install install-backend install-frontend run-backend run-frontend dev stop restart clean-local test-prod-backend test-local-backend

# =========================
# 📦 Install Dependencies
# =========================
install-backend:
	@echo "$(BLUE)📦 Installing backend dependencies...$(NC)"
	@cd be && npm install
	@echo "$(GREEN)✅ Backend ready$(NC)\n"

install-frontend:
	@echo "$(BLUE)📦 Installing frontend dependencies...$(NC)"
	@cd fe && npm install
	@echo "$(GREEN)✅ Frontend ready$(NC)\n"

install: install-backend install-frontend
	@echo "$(GREEN)✅ All dependencies installed.$(NC)"
	@echo "$(BLUE)⚙️ Installing development tools (tmux)...$(NC)"
	@sudo apt update && sudo apt install -y tmux
	@echo "$(GREEN)🎉 Setup complete!$(NC)\n"

# =========================
# 🚀 Run Individually
# =========================
run-backend:
	@echo "$(YELLOW)🚀 Running backend...$(NC)"
	@cd be && npm run dev

run-frontend:
	@echo "$(YELLOW)🚀 Running frontend...$(NC)"
	@cd fe && npm run dev

# =========================
# 🧩 Dev Environment (tmux)
# =========================
dev:
	@command -v tmux >/dev/null 2>&1 || { \
		echo "$(RED)❌ tmux not installed. Run: make install$(NC)"; \
		exit 1; \
	}

	@echo "$(BLUE)🧩 Starting dev environment (tmux)...$(NC)"

	@tmux has-session -t hostify 2>/dev/null || ( \
		echo "$(YELLOW)⚡ Creating new tmux session...$(NC)"; \
		tmux new-session -d -s hostify \; \
		send-keys "cd be && npm run dev" C-m \; \
		split-window -h \; \
		send-keys "cd fe && npm run dev" C-m \
	)

	@echo "$(GREEN)🎯 Attaching to session...$(NC)"
	@tmux attach -t hostify

# =========================
# 🛑 Stop Environment
# =========================
stop:
	@echo "$(RED)🛑 Stopping dev environment...$(NC)"
	@tmux has-session -t hostify 2>/dev/null && ( \
		tmux kill-session -t hostify && \
		echo "$(GREEN)✅ Dev environment stopped$(NC)" \
	) || ( \
		echo "$(YELLOW)⚠️ No active tmux session found$(NC)" \
	)

# =========================
# 🔁 Restart (Safe)
# =========================
restart: stop
	@echo "$(BLUE)♻️ Restarting dev environment...$(NC)"
	@$(MAKE) dev

# =========================
# 🧹 Cleanup
# =========================
clean-local:
	@echo "$(RED)🧹 Cleaning local environment...$(NC)"
	@./scripts/cleanlocal.sh
	@echo "$(GREEN)✅ Clean complete$(NC)\n"

# =========================
# 🧪 Tests
# =========================
test-prod-backend:
	@echo "$(BLUE)🧪 Testing backend (production)...$(NC)"
	@cd be && ./scripts/test-todolist.sh production

test-local-backend:
	@echo "$(BLUE)🧪 Testing backend (local)...$(NC)"
	@cd be && ./scripts/test-todolist.sh local