class DshUpdatePlugin < Formula
  desc "One-command updater for DeepSeek Harness (DSH) CLI and profile plugins"
  homepage "https://github.com/haotian-lu-prog/dsh-update-plugin"
  url "https://github.com/haotian-lu-prog/dsh-update-plugin/archive/refs/tags/v0.1.2.tar.gz"
  sha256 "e144d1622ecceb41bb8b5e5b86e21d386c6aaf9a3cb6b058effc05f2abec3e2c"
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
