install-backend:
	cd be && npm install
run-backend:
	cd be && npm run dev
start:
	cd be && npm run dev
clean-local:
	./scripts/cleanlocal.sh