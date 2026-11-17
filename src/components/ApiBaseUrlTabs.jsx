import CodeBlock from '@theme/CodeBlock'
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

export default function ApiBaseUrlTabs({ showAuth = false, path = '/v1' }) {
  const authLine = showAuth ? '\nAuthorization: Bearer sk-...' : ''

  return (
    <Tabs groupId="knox-api-host" defaultValue="knoxchat">
      <TabItem value="knoxchat" label="KnoxChat">
        <CodeBlock>{`https://api.knox.chat${path}${authLine}`}</CodeBlock>
      </TabItem>
      <TabItem value="knoxstudio" label="KnoxStudio">
        <CodeBlock>{`https://api.knoxstudio.ai${path}${authLine}`}</CodeBlock>
      </TabItem>
    </Tabs>
  )
}
