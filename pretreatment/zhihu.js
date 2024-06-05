/*************************************************************************************************************************
本脚本用于配合 ScriptHub 的脚本预处理功能，将哲也同学 [Map Local] 块中返回空对象的规则转写为 [URL Rewirte] 块中的 reject-dict
哲也同学：https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/script/zheye/zheye.sgmodule
**************************************************************************************************************************/

/**
 * 解析 sgmodule 文件内容，并按块名分类规则
 * @param {string} body - sgmodule 文件内容
 * @return {object} rules - 按块名分类的规则对象
 */
function parseSgmodule(body) {
  // 将文件内容按行分割
  let lines = body.split('\n');

  // 变量初始化
  let currentBlock = '';
  let currentComment = '';
  let rules = {};
  let isCommented = false;
  let rule_flag = false;

  // 遍历每一行
  lines.forEach(line => {
      line = line.trim();
      // 识别元数据
      if (line.startsWith('#!')) {
          if (!rules['metadata']) {
              rules['metadata'] = [];
          }
          rules['metadata'].push(line.trim());
      // 识别规则
      } else {
          // 识别新的块
          if (line.startsWith('[') && line.endsWith(']')) {
              currentBlock = line.slice(1, -1);
              currentComment = '';
          // 识别注释
          // 约定每条规则最多只有一行注释
          } else if (line.startsWith('#')) {
              // 如果已经识别到注释，说明本行为被注释掉的注释
              if (currentComment) {
                  line = line.slice(1).trim();
                  isCommented = true;
                  rule_flag = true;
              } else {
                  currentComment = line.slice(1).trim();
              }
          // 识别规则
          } else if (line) {
              isCommented = false;
              rule_flag = true;
          }
          // 判断是否判断完毕，写入规则
          if (rule_flag) {
              // 初始化块名对应的规则数组
              if (!rules[currentBlock]) {
                  rules[currentBlock] = [];
              }
              if (currentBlock === 'metadate') {
                  rules[currentBlock].push(line.trim())
              } else {
                  rules[currentBlock].push({
                      rule: line,
                      comment: currentComment,
                      isCommented: isCommented
                  });
              }
              // 重置变量
              currentComment = ''; 
              rule_flag = false;
          }
      }
  });
  
  return rules;
}

/**
* 将解析后的规则对象按指定顺序恢复成 sgmodule 文件内容
* @param {object} rules - 按块名分类的规则对象
* @return {string} restoredContent - 恢复后的 sgmodule 文件内容
*/
function restoreSgmodule(rules) {
  let restoredContent = '';

  // 处理元数据
  if (rules['metadata']) {
      rules['metadata'].forEach(meta => {
          restoredContent += `${meta}\n`;
      });
  }

  // 定义块的处理顺序
  const sections = [
      'Rule',   // 规则块
      'other',  // 其余块
      'Script', // 脚本块
      'MITM'    // MITM 块
  ];

  // 处理规则块、脚本块、MITM 块
  sections.forEach(section => {
      if (section !== 'other') {
          if (rules[section] && rules[section].length > 0) {
              restoredContent += `\n[${section}]\n`;
              rules[section].forEach(rule => {
                  if (rule.comment) {
                      restoredContent += `# ${rule.comment}\n`;
                  }
                  if (rule.isCommented) {
                      restoredContent += `# ${rule.rule}\n`;
                  } else {
                      restoredContent += `${rule.rule}\n`;
                  }
              });
          }
      } else {
          // 处理其他规则块，按字母顺序（排除 Rule、Script、MITM）
          Object.keys(rules).sort().forEach(section => {
              if (!['metadata', 'Rule', 'Script', 'MITM'].includes(section) && rules[section].length > 0) {
                  restoredContent += `\n[${section}]\n`;
                  rules[section].forEach(rule => {
                      if (rule.comment) {
                          restoredContent += `# ${rule.comment}\n`;
                      }
                      if (rule.isCommented) {
                          restoredContent += `# ${rule.rule}\n`;
                      } else {
                          restoredContent += `${rule.rule}\n`;
                      }
                  });
              }
          });
      }
  });

  return restoredContent.trim(); // 移除末尾多余的换行符
}

/**
* 按下列要求修改规则
* 1. 将 Map Local 块中 屏蔽我的页面开通会员的卡片 的规则启用
* 2. 将 Map Local 块下的特定规则修改，并写入 URL-Rewrite 块，处理完毕后直接删除
* @param {object} rules - 按块名分类的规则对象
* @return {object} updatedRules - 修改后的规则对象
*/
function modifyRules(rules) {
  // 启用指定规则
  let toBeModifiedRules = [{
      block: 'Map Local',
      condition: {
          element: 'comment',
          data: '屏蔽我的页面开通会员的卡片'
      },
      modification: {
          element: 'isCommented',
          data: false
      }
  }];
  
  // 遍历待修改信息列表
  toBeModifiedRules.forEach(toBeModifiedRule => {
      // 检查 rules 对象中是否存在指定块
      if (rules[toBeModifiedRule.block]) {
          // 遍历指定块中的每个规则
          rules[toBeModifiedRule.block].forEach(rule => {
              // 检查规则的指定条件是否匹配
              if (rule[toBeModifiedRule.condition.element] === toBeModifiedRule.condition.data) {
                  // 修改规则的指定属性
                  rule[toBeModifiedRule.modification.element] = toBeModifiedRule.modification.data;
              }
          });
      }
  });

  // 检查 Map Local 块并修改特定规则
  const targetDataUrl = 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/blank/blank_dict.json';
  const newSuffix = ' - reject-dict';
  if (rules['Map Local']) {
      rules['Map Local'] = rules['Map Local'].filter(ruleObj => {
          if (ruleObj.rule.includes(`data="${targetDataUrl}"`)) {
              let urlRegexMatch = ruleObj.rule.match(/^(.+)\s+data=/);
              // 没有则创建
              if (!rules['URL Rewrite']) {
                  rules['URL Rewrite'] = [];
              }
              if (urlRegexMatch) {
                  let urlRegex = urlRegexMatch[1].trim();
                  // 创建新的 URL Rewrite 规则
                  rules['URL Rewrite'].push({
                      rule: `${urlRegex}${newSuffix}`,
                      comment: ruleObj.comment,
                      isCommented: ruleObj.isCommented
                  });
                  return false; // 删除该规则
              }
          }
          return true; // 保留未处理的规则
      });
  }

  return rules;
}

body = restoreSgmodule(modifyRules(parseSgmodule(body)))
