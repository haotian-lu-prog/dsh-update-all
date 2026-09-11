class DshUpdateAll < Formula
  desc "One-command updater for DeepSeek Harness (DSH) CLI and profile plugins"
  homepage "https://github.com/haotian-lu-prog/dsh-update-all"
  url "https://github.com/haotian-lu-prog/dsh-update-all/archive/refs/tags/v0.1.1.tar.gz"
  sha256 "21e30834ea67e027ebec5b69b87f4eefb5ba8c85e9de8008a1159d14fc678dab"
  license "MIT"
  head "https://github.com/haotian-lu-prog/dsh-update-all.git", branch: "main"

  livecheck do
    url :stable
    strategy :github_latest
  end

  depends_on "node"

  def install
    bin.install "dsh-update-all.sh" => "dsh-update-all"
    pkgshare.install "README.md", "README.zh-CN.md", "CHANGELOG.md", "LICENSE"
  end

  test do
    assert_match "dsh-update-all", shell_output("#{bin}/dsh-update-all --version")
  end
end
