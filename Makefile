SHELL := /bin/bash
.PHONY: help install uninstall test lint format set-repo

help:
	@printf '%s\n' 'Targets:' '  install    install dsh-update-all into ~/.local/bin' '  uninstall  remove the installed command' '  test       run the mock-based test suite' '  lint       bash syntax check + shellcheck (if installed)' '  format     shfmt the shell scripts (if installed)' '  set-repo   replace YOUR_GITHUB_USER placeholders: make set-repo OWNER=name'

install:
	./install.sh --local dsh-update-all.sh

uninstall:
	rm -f "$${DSH_UPDATE_INSTALL_DIR:-$$HOME/.local/bin}/dsh-update-all"

test:
	bash tests/run-tests.sh

lint:
	bash -n dsh-update-all.sh
	bash -n install.sh
	bash -n tests/run-tests.sh
	@if command -v shellcheck >/dev/null 2>&1; then \
		shellcheck dsh-update-all.sh install.sh tests/run-tests.sh; \
	else \
		printf '%s\n' 'shellcheck not installed, skipping'; \
	fi

format:
	@if command -v shfmt >/dev/null 2>&1; then \
		shfmt -w dsh-update-all.sh install.sh tests/run-tests.sh; \
	else \
		printf '%s\n' 'shfmt not installed, skipping'; \
	fi

set-repo:
	@test -n "$(OWNER)" || { printf '%s\n' 'usage: make set-repo OWNER=your-github-user' >&2; exit 1; }
	sed -i.bak 's|YOUR_GITHUB_USER|$(OWNER)|g' README.md README.zh-CN.md CHANGELOG.md SECURITY.md dsh-update-all.sh install.sh .github/ISSUE_TEMPLATE/config.yml
	rm -f README.md.bak README.zh-CN.md.bak CHANGELOG.md.bak SECURITY.md.bak dsh-update-all.sh.bak install.sh.bak .github/ISSUE_TEMPLATE/config.yml.bak
	@printf '%s\n' 'Repository owner set to $(OWNER)'
