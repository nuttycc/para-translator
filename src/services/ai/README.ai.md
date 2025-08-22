

  各个 AI 服务商
  
  - AI: provider
  - Base-AI-Template: base_url, api_key, model, models_list, model-search(fn), provider-icon


需要提前准备 各个 AI 服务商的 基础信息：
  - base_url, provider-icon

当前只考虑 openai sdk 兼容的 AI 服务商，统一使用 openai sdk 进行调用。【#MVP】

用户需要提供 api_key，储存在 storage.local 中。
用户可以从列表中选择 model，默认选择列表中的第一个 model。


模型列表，通过api动态获取，如 https://openrouter.ai/api/v1/models
模型列表，需要有 fallback， 使用预先配置的模型列表
模型列表，需要支持添加自定义 model
模型列表，支持搜索.[#Advanced]


1. 用户点击 “+”/“添加新服务”
2. 呈现添加服务的表单


AI 服务 - 翻译，解析服务

提示词包含变量：title，url 等变量单元（之后进一步确定），以补充上下文，优化翻译效果。
用户可以使用这些变量自定义自己的 prompts
