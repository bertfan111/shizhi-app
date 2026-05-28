#!/bin/bash
# 修复 npm 缓存权限问题的脚本
echo "正在修复 npm 缓存目录权限..."
sudo chown -R $(whoami):$(id -g) /Users/fanbinbin/.npm
echo "修复完成，验证权限："
ls -la /Users/fanbinbin/.npm