install-backend:
	cd be && npm install
run-backend:
	cd be && npm run dev
start:
	cd be && npm run dev
clean-local:
	./scripts/cleanlocal.sh
test-prod-backend:
	cd be && ./scripts/test-todolist.sh production
test-local-backend:
	cd be && ./scripts/test-todolist.sh local