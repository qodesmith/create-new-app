import {getHexGradientStops} from '@qodestack/utils'
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

type ChangeEmailVerificationEmailProps = {
  verificationUrl: string
  newEmail: string
}

// biome-ignore lint/style/noDefaultExport: react.email expects a default export for testing
export default function Email({
  verificationUrl,
  newEmail,
}: ChangeEmailVerificationEmailProps) {
  const appName = '{{PROJECT_NAME}}'
  const cyan400 = '#00d3f3'
  const cyan900 = '#053345'
  const fuchsia500 = '#e12afb'
  // const fuchsia900 = '#4b004f'
  const mainTextColor = '#ffffff'
  const secondaryTextColor = '#999999'
  const appNameColorStops = getHexGradientStops({
    startColor: cyan400,
    endColor: fuchsia500,
    stops: appName.length,
  })

  return (
    <Html>
      <Head />
      <Preview>Confirm your new email for {appName}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: '#333333',
        }}
      >
        <Container
          style={{
            maxWidth: '480px',
            margin: '32px auto',
            padding: '24px 24px 28px',
            backgroundColor: '#111111',
            borderRadius: '18px',
            border: `1px solid ${cyan400}`,
          }}
        >
          <Section style={{textAlign: 'center', marginBottom: '16px'}}>
            <Text style={{margin: 0, fontSize: '24px', fontWeight: 700}}>
              {appName
                .toUpperCase()
                .split('')
                .map((letter, i, arr) => {
                  const color = appNameColorStops[i]

                  return (
                    <span
                      key={i + letter}
                      style={{
                        paddingRight: i === arr.length - 1 ? undefined : '15px',
                        color,
                      }}
                    >
                      {letter}
                    </span>
                  )
                })}
            </Text>
          </Section>

          {/* TITLE */}
          <Section style={{marginBottom: '4px'}}>
            <Text style={{margin: 0, fontSize: '18px', color: mainTextColor}}>
              <strong>Confirm your email change</strong>
            </Text>
          </Section>

          {/* DETAILS */}
          <Section style={{marginBottom: '16px'}}>
            <Text
              style={{
                margin: 0,
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#999999',
              }}
            >
              You requested to change the email address on your {appName}{' '}
              account to{' '}
              <strong style={{color: mainTextColor}}>{newEmail}</strong>. Click
              the button below to confirm your email address change:
            </Text>
          </Section>

          {/* CONFIRM BUTTON */}
          <Section
            style={{
              margin: '20px 0 22px',
              textAlign: 'center',
            }}
          >
            <Link
              href={verificationUrl}
              style={{
                display: 'inline-block',
                padding: '10px 18px',
                borderRadius: '999px',
                backgroundColor: cyan400,
                fontSize: '14px',
                color: '#333333',
              }}
            >
              <strong>Confirm email change</strong>
            </Link>
          </Section>

          {/* FOOTER MESSAGE */}
          <Section style={{marginBottom: '16px'}}>
            <Text
              style={{
                margin: 0,
                fontSize: '12px',
                lineHeight: '1.6',
                color: secondaryTextColor,
              }}
            >
              This link will expire shortly. If you did not request this change,
              please ignore this email and your account email will stay the
              same.
            </Text>
          </Section>

          <Hr style={{borderColor: cyan900, margin: '18px 0 12px'}} />

          {/* MANUAL LINK */}
          <Section>
            <Text
              style={{
                margin: 0,
                fontSize: '12px',
                color: secondaryTextColor,
              }}
            >
              If the button above does not work, copy and paste this URL into
              your browser:
            </Text>
            <Text
              style={{margin: '6px 0 0', fontSize: '11px', color: '#9ca3af'}}
            >
              <Link
                href={verificationUrl}
                style={{color: '#a5b4fc', textDecoration: 'underline'}}
              >
                {verificationUrl}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
