install-backend:
	cd be && npm install
run-backend:
	cd be && npm run dev
install-frontend:
	cd fe && npm install
run-frontend:
	cd fe && npm run start
start:
	@cd be && npm run dev
	@cd fe && npm run start
clean-local:
	./scripts/cleanlocal.sh
test-prod-backend:
	cd be && ./scripts/test-todolist.sh production
test-local-backend:
	cd be && ./scripts/test-todolist.sh local