class DshUpdatePlugin < Formula
  desc "One-command updater for DeepSeek Harness (DSH) CLI and profile plugins"
  homepage "https://github.com/haotian-lu-prog/dsh-update-plugin"
  url "https://github.com/haotian-lu-prog/dsh-update-plugin/archive/refs/tags/v0.2.0.tar.gz"
  sha256 "c984da201bbf35c09c7202e11e56e3bf5e17e1eddb0e6aa6304d966225b0d6c8"
  license "MIT"
  head "https://github.com/haotian-lu-prog/dsh-update-plugin.git", branch: "main"

  livecheck do
    url :stable
    strategy :github_latest
  end

  depends_on "node"

  def install
    bin.install "dsh-update-plugin.sh" => "dsh-update-plugin"
    pkgshare.install "README.md", "README.zh-CN.md", "CHANGELOG.md", "LICENSE"
  end

  test do
    assert_match "dsh-update-plugin", shell_output("#{bin}/dsh-update-plugin --version")
  end
end
