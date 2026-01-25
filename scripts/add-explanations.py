#!/usr/bin/env python3
"""
Script to add explanations to SOA-C03 exam questions.
Explains why the correct answer is right and why other options are wrong.
"""

import json

# All explanations for SOA-C03 questions (65 questions)
EXPLANATIONS = {
    1: """<p><strong>正确答案 C：</strong>PrivateDnsName 是 EC2 实例的一个属性，不能通过 CloudFormation 模板直接设置。它由 AWS 自动分配给启用了 DNS 主机名的 VPC 中的实例。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> Outputs 部分是可选的，省略它不会导致堆栈创建失败。</li>
<li><strong>B:</strong> Parameters 部分也是可选的，只有在模板引用参数但未定义时才会失败。</li>
<li><strong>D:</strong> VPC 可以在模板中定义或通过默认 VPC 使用，不一定需要显式指定。</li>
</ul>""",

    2: """<p><strong>正确答案 B：</strong>要在 Cost Explorer 中使用标签筛选，必须先在 Billing and Cost Management 控制台中激活用户定义的成本分配标签。仅添加标签不会自动使其可用于成本分析。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 激活标签后，数据通常在 24 小时内可用，不需要 30 天。</li>
<li><strong>C:</strong> Cost and Usage Report 用于导出详细成本数据，不是在 Cost Explorer 中使用标签的前提条件。</li>
<li><strong>D:</strong> AWS Budgets 用于设置预算警报，与标签在 Cost Explorer 中的可用性无关。</li>
</ul>""",

    3: """<p><strong>正确答案 A：</strong>Systems Manager Run Command 配合 append-config 选项是最高效的方法。它允许在不覆盖现有配置的情况下添加新的日志收集配置，并可以批量操作多个实例。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> 手动登录每个实例操作效率极低，且 PowerShell 脚本的管理和维护也更复杂。</li>
<li><strong>C:</strong> 在每个实例上运行配置向导需要手动交互，无法自动化，效率很低。</li>
<li><strong>D:</strong> 选择"高级详细级别"不能保证捕获特定的 DHCP 日志文件。</li>
</ul>""",

    4: """<p><strong>正确答案 B：</strong>S3 Object Lock 的合规模式（Compliance Mode）提供最强的保护 - 在保留期内，任何人（包括 root 用户）都无法删除或覆盖对象。这确保了备份在 3 个月内不会被删除。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 手动管理 IAM 策略来跟踪每个对象的时间是不切实际的，且容易出错。</li>
<li><strong>C:</strong> S3 Versioning 和 Lifecycle 规则不能阻止删除操作，只能管理版本和过期。</li>
<li><strong>D:</strong> 治理模式（Governance Mode）允许具有特定权限的用户覆盖保护，不如合规模式严格。</li>
</ul>""",

    5: """<p><strong>正确答案 A：</strong>VPC Flow Logs 发布到 CloudWatch Logs 需要 IAM 角色具有 logs:CreateLogGroup 权限来创建日志组。缺少此权限会导致日志无法发布。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> logs:CreateExportTask 用于将日志导出到 S3，不是发布流日志所需的权限。</li>
<li><strong>C:</strong> IPv6 配置与 VPC Flow Logs 的发布能力无关。</li>
<li><strong>D:</strong> VPC 对等连接不会影响流日志的发布。</li>
</ul>""",

    6: """<p><strong>正确答案 A：</strong>应用需要会话亲和性，但使用了 weighted random 算法，这会导致请求被随机分发到不同实例，破坏会话状态。Least Outstanding Requests 算法能更好地支持会话亲和性。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> 异常缓解功能用于处理异常实例，不能解决会话亲和性问题。</li>
<li><strong>C:</strong> 关闭跨区域负载均衡会影响流量分配，但不能解决会话亲和性问题。</li>
<li><strong>D:</strong> 取消注册延迟与会话亲和性无关。</li>
</ul>""",

    7: """<p><strong>正确答案 C：</strong>Aurora Backtracking 允许将数据库"倒回"到指定的恢复点，且在同一个生产集群上操作，无需创建新集群。这是满足"在同一生产集群中恢复"要求的唯一选项。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 创建副本并升级会创建新的数据库实例，不是在同一集群上恢复。</li>
<li><strong>B:</strong> 自动备份无法直接恢复到现有集群。</li>
<li><strong>D:</strong> 时间点恢复会创建一个新的数据库集群，不是在原集群上恢复。</li>
</ul>""",

    8: """<p><strong>正确答案 B：</strong>OnFailure 参数设置为 DO_NOTHING 会在堆栈创建失败时保留已成功创建的资源，允许工程师进行调试和故障排除。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> DisableRollback 设置为 False 会启用回滚（默认行为），这与目标相反。</li>
<li><strong>C:</strong> 没有 DO_NOTHING 这样的回滚触发器配置选项。</li>
<li><strong>D:</strong> OnFailure 设置为 ROLLBACK 会在失败时删除所有资源（默认行为）。</li>
</ul>""",

    9: """<p><strong>正确答案 B：</strong>正确的配置是：在端口 80 上创建 HTTP 监听器，在端口 443 上创建 HTTPS 监听器并附加 SSL/TLS 证书，然后创建规则将 HTTP 流量重定向到 HTTPS。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> HTTPS 监听器不能在端口 80 上运行，端口 80 用于 HTTP。</li>
<li><strong>C:</strong> ALB 不支持 TCP 监听器，只支持 HTTP/HTTPS。</li>
<li><strong>D:</strong> NLB 不支持 HTTP 到 HTTPS 的重定向规则，且不适用于此场景。</li>
</ul>""",

    10: """<p><strong>正确答案 B：</strong>Service Control Policy (SCP) 可以附加到特定的 OU，并对该 OU 中的所有账户生效。使用条件拒绝缺少标签的 RunInstances 操作是正确的方法。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> IAM 组只在单个账户内有效，无法跨多个账户应用。</li>
<li><strong>C:</strong> IAM 角色需要在每个账户中单独创建和管理，管理开销大。</li>
<li><strong>D:</strong> 附加到根 OU 会影响组织中的所有账户，而不仅仅是应用 OU。</li>
</ul>""",

    11: """<p><strong>正确答案 C：</strong>Systems Manager Run Command 的速率控制功能可以限制并发执行次数为 30，并通过标签精确定位目标实例。这是最高效的自动化解决方案。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 创建额外的标签和手动分批执行增加了复杂性和操作开销。</li>
<li><strong>B:</strong> Lambda 的保留并发控制的是函数本身，不是 Run Command 的并发。</li>
<li><strong>D:</strong> Step Functions 并行状态的配置更复杂，且需要手动运行多次。</li>
</ul>""",

    12: """<p><strong>正确答案 A：</strong>Route 53 健康检查可以监控端点的可用性。为每个加权记录添加健康检查后，Route 53 会自动停止将流量路由到不健康的端点。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> 增加特定区域的权重不能自动检测和避免不健康的端点。</li>
<li><strong>C:</strong> 重新配置为基于延迟的路由不能解决端点健康检查问题。</li>
<li><strong>D:</strong> 降低 TTL 只能更快地传播 DNS 更改，但不能检测不健康的端点。</li>
</ul>""",

    13: """<p><strong>正确答案 A 和 E：</strong>创建 Distributor 包来打包第三方代理，然后使用 State Manager 关联运行 AWS-ConfigureAWSPackage 文档来自动安装和更新包，这是最少操作开销的组合。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> OpsItem 用于事件管理，不用于软件部署。</li>
<li><strong>C:</strong> 使用 Lambda 登录实例不是最佳实践，且难以管理。</li>
<li><strong>D:</strong> AWS-RunRemoteScript 不如 AWS-ConfigureAWSPackage 专门用于包管理。</li>
</ul>""",

    14: """<p><strong>正确答案 A：</strong>Patch Manager 可以定义补丁基线，使用扫描功能识别受影响的实例，然后使用 Patch Now 选项在每个区域快速部署补丁。这提供了最低的操作开销。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> AWS Config 不能直接识别需要特定补丁的实例。</li>
<li><strong>C:</strong> EventBridge 规则响应合规事件会增加复杂性。</li>
<li><strong>D:</strong> 手动启动新实例替换旧实例是最高操作开销的方法。</li>
</ul>""",

    15: """<p><strong>正确答案 D：</strong>配置 EventBridge 事件触发 Lambda 函数，让函数自动修改安全组移除公开访问规则，这是事件驱动且自动化的解决方案。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 停止实例不能修复安全组问题，且会影响服务可用性。</li>
<li><strong>B:</strong> cron 作业不是事件驱动的方法，且移除实例而非修复规则不恰当。</li>
<li><strong>C:</strong> 修改为 SFTP 不能修复安全组暴露问题。</li>
</ul>""",

    16: """<p><strong>正确答案 A：</strong>集群放置组（Cluster Placement Group）将实例放置在同一可用区的紧密网络中，提供最低的网络延迟和最高的吞吐量，非常适合 HPC 工作负载。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> 分区放置组用于分布式工作负载，跨可用区会增加延迟。</li>
<li><strong>C:</strong> 分区放置组设计用于减少相关故障，不是优化网络性能。</li>
<li><strong>D:</strong> 分布放置组将实例分散在不同硬件上，会增加网络延迟。</li>
</ul>""",

    17: """<p><strong>正确答案 D：</strong>将 Security Hub 指定为管理员账户并配置组织自动加入成员账户，这是最高效的方法。新账户会自动成为成员，无需手动配置脚本。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 创建脚本手动发送和接受邀请比使用组织集成更麻烦。</li>
<li><strong>B:</strong> Amazon Inspector 不支持 CIS AWS Foundations Benchmark。</li>
<li><strong>C:</strong> GuardDuty 是威胁检测服务，不运行 CIS 基准扫描。</li>
</ul>""",

    18: """<p><strong>正确答案 C：</strong>AWS Compute Optimizer 可以自动分析 EBS 卷的性能指标（包括 IOPS 和吞吐量），并提供优化建议。这是最高效的方法。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> EC2 控制台的监控图表不提供 EBS 性能优化建议。</li>
<li><strong>B:</strong> 更改实例类型不能直接优化 EBS 卷性能。</li>
<li><strong>D:</strong> 使用 fio 工具手动基准测试效率很低。</li>
</ul>""",

    19: """<p><strong>正确答案 D：</strong>使用 AWS Config 托管规则检测未启用日志的存储桶，并使用 Systems Manager Automation runbook 自动修复，这是最高效的自动化解决方案。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> Trusted Advisor 检查不能自动启用日志功能。</li>
<li><strong>B:</strong> S3 存储桶策略不能强制启用日志。</li>
<li><strong>C:</strong> 使用 Lambda 函数比使用现有的 SSM runbook 更复杂。</li>
</ul>""",

    20: """<p><strong>正确答案 B：</strong>EventBridge 计划规则可以按 cron 表达式触发，直接发布消息到 SNS 主题。这是最简单、最高效的无服务器解决方案。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 运行 EC2 实例并配置 cron 作业需要额外的基础设施管理。</li>
<li><strong>C:</strong> SNS 订阅本身不能按计划触发消息发送。</li>
<li><strong>D:</strong> Step Functions 调度功能比 EventBridge 规则更复杂。</li>
</ul>""",

    21: """<p><strong>正确答案 A：</strong>跨账户复制时，默认情况下复制的对象仍由源账户拥有。修改复制配置以更改对象所有权为目标账户，可以解决访问被拒绝的问题。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> 复制规则的范围与对象访问权限无关。</li>
<li><strong>C:</strong> S3 RTC 控制复制时间，不影响访问权限。</li>
<li><strong>D:</strong> 存储类更改不影响对象访问权限。</li>
</ul>""",

    22: """<p><strong>正确答案 D：</strong>使用 IAM 角色（而非 IAM 用户）为 EC2 实例提供凭证是最安全的做法。角色策略应仅授予所需的最小权限（SendMessage、ReceiveMessage、DeleteMessage）。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 在应用配置中嵌入 IAM 用户凭证是不安全的。</li>
<li><strong>B:</strong> 使用环境变量存储凭证也不安全。</li>
<li><strong>C:</strong> sqs:* 权限过于宽泛，违反最小权限原则。</li>
</ul>""",

    23: """<p><strong>正确答案 C：</strong>Secrets Manager 可以自动轮换数据库凭证。RDS Proxy 提供连接池功能，可以有效处理突发的数据库连接，非常适合写密集型和可变连接的场景。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> KMS 用于加密密钥轮换，不是数据库凭证轮换。</li>
<li><strong>B:</strong> 读取副本用于读取扩展，不能处理写入连接池。</li>
<li><strong>D:</strong> 读取副本不能处理写密集型连接突增。</li>
</ul>""",

    24: """<p><strong>正确答案 B：</strong>Route 53 Resolver 出站端点可以将 DNS 查询转发到本地 DNS 服务器，无需手动维护主机名映射。这是最低维护开销的解决方案。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 私有托管区需要手动维护所有主机名和 IP 地址。</li>
<li><strong>C:</strong> 反向 DNS 查询转发不能解决正向 DNS 解析问题。</li>
<li><strong>D:</strong> 手动更新每个实例的 hosts 文件维护开销最大。</li>
</ul>""",

    25: """<p><strong>正确答案 A：</strong>CloudWatch Logs 指标筛选器可以持续监控日志并创建自定义指标，计算 HTTP 404 响应的数量。这是最高效的持续监控方案。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> 订阅筛选器用于实时流式传输日志，不是创建指标。</li>
<li><strong>C:</strong> Lambda 函数按计划运行 Insights 查询不如指标筛选器高效。</li>
<li><strong>D:</strong> 运行脚本需要额外的基础设施管理。</li>
</ul>""",

    26: """<p><strong>正确答案 C：</strong>将 Auto Scaling 组扩展到第二个可用区可以提供高可用性。如果一个可用区发生故障，另一个可用区的实例可以继续服务。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 增加最大实例数不能提供可用区级别的冗余。</li>
<li><strong>B:</strong> 增加最小实例数也不能提供可用区级别的高可用性。</li>
<li><strong>D:</strong> Auto Scaling 组不能跨区域运行，这需要额外的架构设计。</li>
</ul>""",

    27: """<p><strong>正确答案 A：</strong>网络 ACL 是无状态的，需要显式配置入站和出站规则。新创建的 ACL 默认拒绝所有流量。没有配置出站规则允许临时端口返回流量会导致响应无法返回客户端。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> 安全组是有状态的，不需要显式配置出站返回流量规则。</li>
<li><strong>C:</strong> 弹性 IP 地址一旦分配就不会自动更改。</li>
<li><strong>D:</strong> 每个子网只能关联一个网络 ACL。</li>
</ul>""",

    28: """<p><strong>正确答案 C：</strong>AmazonSSMManagedInstanceCore 策略提供 SSM Agent 与 Systems Manager 服务通信所需的最小权限。没有适当的 IAM 权限，实例无法注册到 Fleet Manager。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> NAT 网关和 NAT 实例的网络功能相同，替换不能解决问题。</li>
<li><strong>B:</strong> 如果已有 NAT 网关可用，VPC 端点是可选的，问题是 IAM 权限。</li>
<li><strong>D:</strong> ssm* 全部权限违反最小权限原则。</li>
</ul>""",

    29: """<p><strong>正确答案 D：</strong>使用两个独立的队列（警报队列和信息队列），让应用优先从警报队列获取消息，是实现消息优先级的正确方法。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 更快的扩展不能区分消息优先级。</li>
<li><strong>B:</strong> SNS fanout 是并行发送，不能实现优先级处理。</li>
<li><strong>C:</strong> DynamoDB 流与消息优先级无关。</li>
</ul>""",

    30: """<p><strong>正确答案 B：</strong>AWS Support 计划决定了可用的 Trusted Advisor 检查数量。Basic 和 Developer 支持只提供核心检查，Business 和 Enterprise 支持提供完整的检查集。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> EC2 实例状态与 Trusted Advisor 检查可用性无关。</li>
<li><strong>C:</strong> SCP 控制权限，不影响 Trusted Advisor 检查数量。</li>
<li><strong>D:</strong> root 用户的 MFA 状态不影响检查可用性。</li>
</ul>""",

    31: """<p><strong>正确答案 D：</strong>CloudFormation StackSets 专门设计用于在多个账户和区域部署相同的模板，是最低操作开销的解决方案。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 手动切换角色部署到每个账户效率低。</li>
<li><strong>B:</strong> 创建 Lambda 函数需要额外的代码开发和维护。</li>
<li><strong>C:</strong> 仅查询账户列表不能自动部署模板。</li>
</ul>""",

    32: """<p><strong>正确答案 C：</strong>CNAME 记录用于将一个域名映射到另一个域名。由于目标是外部托管商的域名（app.example.com），需要使用 CNAME 记录。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> A 记录将域名映射到 IP 地址，不是另一个域名。</li>
<li><strong>B:</strong> 别名记录用于指向 AWS 资源，不能指向外部域名。</li>
<li><strong>D:</strong> PTR 记录用于反向 DNS 查询（IP 到域名）。</li>
</ul>""",

    33: """<p><strong>正确答案 C：</strong>创建读取副本并启用 Multi-AZ 可以在主节点故障时自动故障转移到副本，最大限度减少 RTO。这是提高弹性的最佳方案。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> Memcached 不支持持久性和复制，不适合需要弹性的场景。</li>
<li><strong>B:</strong> 每小时备份的恢复时间较长，不能最小化 RTO。</li>
<li><strong>D:</strong> 自动备份恢复也需要较长时间，不如 Multi-AZ 故障转移快。</li>
</ul>""",

    34: """<p><strong>正确答案 B：</strong>使用 EventBridge 规则定期触发 Lambda 函数检查 CloudFormation 堆栈漂移，可以检测 IAM 策略在部署后的任何更改，并通过 SNS 发送通知。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> CloudTrail 不能直接发送邮件通知。</li>
<li><strong>C:</strong> IAM Access Analyzer 用于分析权限，不是检测策略更改。</li>
<li><strong>D:</strong> 手动存储和比较 JSON 文档需要更多管理工作。</li>
</ul>""",

    35: """<p><strong>正确答案 A：</strong>使用 QuickSight 的 VPC 接口端点（通过 PrivateLink）可以确保所有流量保持在 VPC 网络边界内，同时 manifest 文件指向 S3 数据源。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> 使用 EC2 代理增加了不必要的复杂性。</li>
<li><strong>C:</strong> S3 网关端点不能确保 QuickSight 连接保持在 VPC 内。</li>
<li><strong>D:</strong> NAT 网关使流量通过公共互联网，不满足网络边界要求。</li>
</ul>""",

    36: """<p><strong>正确答案 B：</strong>FSx for Windows File Server Multi-AZ 文件系统提供跨可用区的高可用性，原生支持 SMB 协议和 Windows ACL，完美满足所有需求。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 单个文件网关不提供高可用性。</li>
<li><strong>C:</strong> ALB 不能用于文件网关的负载均衡。</li>
<li><strong>D:</strong> 两个 Single-AZ 文件系统配合 DFSR 比 Multi-AZ 更复杂。</li>
</ul>""",

    37: """<p><strong>正确答案 A：</strong>CloudWatch Agent 的 procstat 插件可以收集进程级别的 CPU 指标，包括进程 ID (PID)，是最简单的解决方案。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> Lambda 函数无法直接访问 EC2 实例内部的进程信息。</li>
<li><strong>C:</strong> 每晚手动登录检查效率极低。</li>
<li><strong>D:</strong> 默认的 CloudWatch CPU 指标不包含进程级别的信息。</li>
</ul>""",

    38: """<p><strong>正确答案 C：</strong>CloudWatch Synthetics 心跳监控 canary 可以模拟用户访问，从用户角度准确监控网站可用性，并通过 SuccessPercent 指标触发警报。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 基于日志的警报不能提供准确的用户体验视图。</li>
<li><strong>B:</strong> 异常检测不能设置具体的 99% 可用性阈值。</li>
<li><strong>D:</strong> 断链检查器用于检查链接有效性，不是可用性监控。</li>
</ul>""",

    39: """<p><strong>正确答案 B：</strong>将私有子网路由表更新为通过现有 NAT 网关路由互联网流量。当 NAT 网关减少到一个后，需要确保所有私有子网的路由表都指向这个 NAT 网关。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 替换为 NAT 实例不能解决路由问题。</li>
<li><strong>C:</strong> 直接路由到互联网网关会使私有子网变成公共子网。</li>
<li><strong>D:</strong> NAT 网关不支持添加辅助 IP 地址。</li>
</ul>""",

    40: """<p><strong>正确答案 D：</strong>将 DeletionPolicy 设置为 Retain 可以在堆栈删除时保留资源和数据。这是唯一能保留实例及其数据的方法。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> Snapshot 策略对于 EC2 实例不起作用（只适用于 EBS 卷和 RDS）。</li>
<li><strong>B:</strong> DLM 备份不能阻止堆栈删除时实例被删除。</li>
<li><strong>C:</strong> AWS Backup 也不能阻止实例被删除。</li>
</ul>""",

    41: """<p><strong>正确答案 C：</strong>EC2 Image Builder 支持创建自定义配方来安装应用和依赖，内置漏洞扫描功能，并可以按计划自动构建更新的 AMI。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> Packer 脚本需要额外管理，且不内置漏洞扫描。</li>
<li><strong>B:</strong> 手动创建 AMI 不能自动化更新过程。</li>
<li><strong>D:</strong> CreateImage API 不能安装依赖或进行漏洞扫描。</li>
</ul>""",

    42: """<p><strong>正确答案 D：</strong>Network Load Balancer 可以为每个可用区分配静态 IP 地址，能够处理每秒数百万请求，并且针对突发流量模式进行了优化。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> SQS 队列不是负载均衡解决方案。</li>
<li><strong>B:</strong> ALB 不支持静态 IP 地址。</li>
<li><strong>C:</strong> Global Accelerator 提供静态 anycast IP，但不是每个可用区一个。</li>
</ul>""",

    43: """<p><strong>正确答案 B 和 E：</strong>启用 ALB 目标组的粘性会话确保用户请求发送到同一实例，配置 CloudFront 转发 cookie 确保会话信息传递到 ALB。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 更改路由算法不能解决会话问题。</li>
<li><strong>C:</strong> 头部转发与会话状态无关。</li>
<li><strong>D:</strong> 监听器规则级别的粘性不存在。</li>
</ul>""",

    44: """<p><strong>正确答案 B：</strong>由于工作负载分布在 5 个区域，需要在每个区域创建 Transit Gateway 并进行跨区域对等连接。Transit Gateway 可以在区域内共享，连接各个 VPC。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 单个 Transit Gateway 不能跨多个区域工作。</li>
<li><strong>C:</strong> Site-to-Site VPN 用于连接本地数据中心，不是 VPC 之间。</li>
<li><strong>D:</strong> VPC 对等不能传递路由，管理复杂性高。</li>
</ul>""",

    45: """<p><strong>正确答案 A 和 E：</strong>RDS Performance Insights 可以识别影响性能的 SQL 查询，RDS Proxy 提供连接池来处理连接激增，两者结合解决性能和连接问题。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> CloudWatch Logs Insights 不是分析数据库查询的工具。</li>
<li><strong>C:</strong> 单可用区不能提高性能。</li>
<li><strong>D:</strong> 禁用连接池会加剧连接问题。</li>
</ul>""",

    46: """<p><strong>正确答案 C：</strong>使用目标跟踪扩展策略的 Auto Scaling 组可以根据指标（如 CPU 使用率或请求数）自动调整容量，这是处理随机流量波动的最佳方案。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> CloudWatch 警报不能自动增加实例大小。</li>
<li><strong>B:</strong> EventBridge 规则不能直接向 ALB 添加实例。</li>
<li><strong>D:</strong> 计划扩展适用于可预测的流量，不适合随机流量。</li>
</ul>""",

    47: """<p><strong>正确答案 B：</strong>RDS 读取副本可以分担读取流量，减轻主数据库的负载。报告作业是读取密集型的，应该从读取副本查询数据。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> ElastiCache 更适合频繁访问的数据缓存，不适合报告查询。</li>
<li><strong>C:</strong> CloudFront 不能直接连接 RDS 数据库。</li>
<li><strong>D:</strong> 增加实例大小成本更高，不如读取副本高效。</li>
</ul>""",

    48: """<p><strong>正确答案 C：</strong>Route 53 Resolver DNS Firewall 专门设计用于检测和过滤 DNS 级别的威胁，可以阻止对已知恶意域名的 DNS 查询。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> Shield Advanced 防护 DDoS 攻击，不是 DNS 威胁。</li>
<li><strong>B:</strong> WAF 检查 HTTP/HTTPS 流量，不是 DNS 流量。</li>
<li><strong>D:</strong> AWS Config 用于配置合规性，不是 DNS 威胁检测。</li>
</ul>""",

    49: """<p><strong>正确答案 A：</strong>拍摄 RDS 快照，修改 KMS 密钥策略允许迁移账户访问，然后共享快照。这是最少管理开销的跨账户共享加密数据库的方法。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> RDS 读取副本不能直接跨账户创建。</li>
<li><strong>C:</strong> 创建相同别名的新 KMS 密钥不能解密原来的快照。</li>
<li><strong>D:</strong> 手动导出/导入数据库管理开销最大。</li>
</ul>""",

    50: """<p><strong>正确答案 A：</strong>CloudWatch Logs Insights 支持跨多个日志组查询，stats 命令和 count 函数可以统计和分组错误类型。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> CloudWatch Logs 搜索没有 groupby 关键字。</li>
<li><strong>C:</strong> 使用 Athena 需要先将日志导出到 S3，增加复杂性。</li>
<li><strong>D:</strong> RDS 与 Lambda 日志分析无关。</li>
</ul>""",

    51: """<p><strong>正确答案 B：</strong>CloudWatch 警报可以配置 EC2 操作直接重启实例，同时发布 SNS 通知。这是最简单的方案，无需额外的 Lambda 函数。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 使用 Lambda 函数增加了不必要的复杂性。</li>
<li><strong>C:</strong> Incident Manager 用于事件响应，不是自动重启。</li>
<li><strong>D:</strong> 创建 SSM runbook 比直接使用 CloudWatch 操作更复杂。</li>
</ul>""",

    52: """<p><strong>正确答案 C：</strong>别名记录（Alias Record）是 Route 53 特有的功能，可以将域名顶点（如 example.com）映射到 AWS 资源（如 ALB），且不产生额外的 DNS 查询费用。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> A 记录需要 IP 地址，但 ALB 的 IP 可能会变化。</li>
<li><strong>B:</strong> AAAA 记录用于 IPv6 地址。</li>
<li><strong>D:</strong> CNAME 记录不能用于域名顶点（zone apex）。</li>
</ul>""",

    53: """<p><strong>正确答案 A：</strong>slow_start.duration_seconds 属性可以让新注册的目标在指定时间内逐渐接收流量，非常适合需要预热的应用。设置为 120 秒匹配缓存填充时间。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> HealthCheckTimeoutSeconds 控制健康检查超时，不是流量分配。</li>
<li><strong>C:</strong> weighted_random 算法不能实现慢启动。</li>
<li><strong>D:</strong> 生命周期钩子需要修改应用代码，更复杂。</li>
</ul>""",

    54: """<p><strong>正确答案 C：</strong>Aurora PostgreSQL 不支持 Backtrack（仅 MySQL 兼容版支持）。时间点恢复会创建新的数据库集群，需要重新配置应用程序端点。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> Backtrack 功能仅适用于 Aurora MySQL，不适用于 PostgreSQL。</li>
<li><strong>B:</strong> 时间点恢复不能在现有数据库上执行，会创建新集群。</li>
<li><strong>D:</strong> 从 S3 恢复需要先有 S3 导出，不是标准恢复方法。</li>
</ul>""",

    55: """<p><strong>正确答案 A：</strong>CloudWatch 警报可以监控 Trusted Advisor 服务配额指标，当使用量超过阈值时通过 SNS 发送邮件通知。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> SQS 队列不能直接发送邮件通知。</li>
<li><strong>C:</strong> Health Dashboard 不监控服务配额使用情况。</li>
<li><strong>D:</strong> Health Dashboard 不适用于此监控场景。</li>
</ul>""",

    56: """<p><strong>正确答案 D：</strong>在无互联网访问的私有 VPC 中运行 Synthetics，需要：启用 DNS 选项、创建 CloudWatch 接口端点和 S3 网关端点，并授予适当权限。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 需要端点而非 VPC 设置和权限调整。</li>
<li><strong>B:</strong> DNS 选项应该开启，不是关闭。</li>
<li><strong>C:</strong> DNS 选项应该开启，仅安全组规则不够。</li>
</ul>""",

    57: """<p><strong>正确答案 C 和 D：</strong>私有子网中的 Lambda 需要访问 SQS，可以通过 NAT 网关访问公共 SQS 端点，或通过创建 SQS 的接口端点直接在 VPC 内访问。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 断开 VPC 连接会破坏与 RDS 的连接。</li>
<li><strong>B:</strong> RDS Proxy 与 SQS 访问无关。</li>
<li><strong>E:</strong> SQS 使用接口端点，不是网关端点。</li>
</ul>""",

    58: """<p><strong>正确答案 B：</strong>AWS Config 支持自动修复操作，AWS-DisableIncomingSSHOnPort22 是预定义的修复动作，可以自动移除不合规的 SSH 规则。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> CloudWatch 警报方案更复杂。</li>
<li><strong>C:</strong> EventBridge 方案需要编写 Lambda 代码。</li>
<li><strong>D:</strong> 每小时检查不如实时修复高效。</li>
</ul>""",

    59: """<p><strong>正确答案 C 和 D：</strong>HTTP Layer 7 状态码包含在 ALB 访问日志和 CloudFront 访问日志中，这两个日志记录 HTTP 请求和响应信息。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> VPC Flow Logs 只记录 Layer 3/4 信息，不包含 HTTP 状态码。</li>
<li><strong>B:</strong> CloudTrail 记录 API 调用，不是 HTTP 流量。</li>
<li><strong>E:</strong> RDS 日志记录数据库操作，不是 HTTP 状态码。</li>
</ul>""",

    60: """<p><strong>正确答案 B：</strong>详细监控（1 分钟间隔）允许创建 2 分钟持续时间的警报。基本监控（5 分钟间隔）无法检测 2 分钟的条件。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 基本监控的 5 分钟间隔无法检测 2 分钟的 CPU 峰值。</li>
<li><strong>C:</strong> 每 2 分钟检查一次可能会错过实际的 CPU 峰值时间。</li>
<li><strong>D:</strong> EC2 健康检查不检测 CPU 使用率。</li>
</ul>""",

    61: """<p><strong>正确答案 B 和 D：</strong>将用户添加到 IAM 用户组可以集中管理策略，客户托管策略支持版本控制和跨多个实体共享。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 服务链接角色由 AWS 服务创建和管理，不能用于用户访问。</li>
<li><strong>C:</strong> AWS 托管策略不能被修改或版本化。</li>
<li><strong>E:</strong> 内联策略不能跨多个实体共享。</li>
</ul>""",

    62: """<p><strong>正确答案 D：</strong>Warm Pool 预先启动实例并保持在停止状态，当需要扩展时可以快速启动，避免长时间的引导脚本等待。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 更大的实例不能减少引导脚本时间。</li>
<li><strong>B:</strong> 增加最小实例数会导致过度配置。</li>
<li><strong>C:</strong> 预测扩展基于历史模式，不能解决引导时间问题。</li>
</ul>""",

    63: """<p><strong>正确答案 D：</strong>子网 CIDR 块创建后不能修改。要部署更多实例，需要创建一个新的子网。11 个实例说明当前子网可能使用了 /28 CIDR（16 个 IP，AWS 保留 5 个）。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> 子网 CIDR 不能被编辑或扩展。</li>
<li><strong>B:</strong> 子网不能跨可用区。</li>
<li><strong>C:</strong> 弹性 IP 与私有子网可用 IP 数量无关。</li>
</ul>""",

    64: """<p><strong>正确答案 A：</strong>自定义事件总线用于应用特定事件，存档功能可以记录事件以便稍后按类型或时间重放。规则将事件发送到 Lambda 处理。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>B:</strong> 默认事件总线用于 AWS 服务事件，不适合自定义应用事件。</li>
<li><strong>C:</strong> EventBridge Pipes 不用于存档事件。</li>
<li><strong>D:</strong> CloudWatch Logs 不支持按事件类型或时间重放事件。</li>
</ul>""",

    65: """<p><strong>正确答案 B 和 D：</strong>CloudFormation 模板跨区域部署失败的常见原因：AMI ID 是区域特定的，不能跨区域使用；某些 AWS 服务可能在某些区域不可用。</p>
<p><strong>为什么其他选项错误：</strong></p>
<ul>
<li><strong>A:</strong> IAM 用户是全局资源，在所有区域可用。</li>
<li><strong>C:</strong> 权限问题会在部署开始时就失败，不会部分部署。</li>
<li><strong>E:</strong> CloudFormation 模板可以用于创建新堆栈。</li>
</ul>"""
}


def main():
    # Read the original JSON file
    with open('/home/user/question-crushing-king/public/data/SOA-C03.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Update explanations for each question
    for question in data['questions']:
        q_num = question['questionNumber']
        if q_num in EXPLANATIONS:
            question['explanation'] = EXPLANATIONS[q_num]

    # Write the updated JSON file
    with open('/home/user/question-crushing-king/public/data/SOA-C03.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Updated {len(EXPLANATIONS)} questions with explanations.")


if __name__ == '__main__':
    main()
