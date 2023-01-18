---
title: 'Implementing Google Analytics, Adsense Auto Ads and Ad Units to Next.js App'
date: 2022-11-23T07:43:00.476Z
tags: ['seo', 'adsense', 'nextjs', 'javascript']
showTOC: true
cover:
  image: 'implementing-google-analytics-adsense.jpg'
  alt: 'implementing google analytics adsense'
---

Hello everyone! Google Analytics implementation is easy for Next.js because router module makes easy to implementation. But Google Adsense is worst than ever. I tried a lot of way to implementing Google Adsense to my Next.js app. Finally I found best solution. I will show you the best way that is optimized for page speed. Let's start! First of all I want to stay user experience great so I make small hack with a consent component. I do not load all scripts on first, If user clicks on anywhere or accept constent, I will load Google Adsense script, and also Google Analytics. It's trick. Of course you can load after page load without extra consent component, just use useEffect + setTimeout and call triggers that below.

    Theme: Chakra UI
    
    Next.js Version: 12.2.3
    
    Package Manager: yarn

Creating Basic Consent Component
--------------------------------

First, install all requirements for working with consent:

    yarn add cookies-next

Create consent component on components/sections/Consent.tsx You can create more complex consent components (like with a deny button or consent adjustments).

    import { useEffect, useRef, useState } from 'react';
    import { useRouter } from 'next/router';
    
    import { useTranslation } from 'next-i18next';
    import { Stack, Text, Button, Link, useOutsideClick } from '@chakra-ui/react';
    import { setCookie, hasCookie } from 'cookies-next';
    import { enableGoogleAdsense, enableGoogleAnalytics } from '../../lib/Google/Google';
    
    export default function Consent() {
      const { locale } = useRouter();
      const { t } = useTranslation('common');
      const [consent, setConsent] = useState(true);
      const ref = useRef();
    
      useOutsideClick({
        ref: ref,
        handler: () => acceptCookie(),
      });
    
      useEffect(() => {
        setConsent(hasCookie('localConsent'));
        if (hasCookie('localConsent')) {
          enableGoogleAnalytics();
          enableGoogleAdsense();
        }
      }, []);
    
      const acceptCookie = () => {
        enableGoogleAdsense();
        setConsent(true);
        setCookie('localConsent', 'true', { maxAge: 60 * 60 * 24 * 365 });
      };
    
      if (consent === true) {
        return null;
      }
    
      const privacyPolicyUrl =
        locale == 'tr' ? '/tr/gizlilik-politikasi' : '/en/privacy-policy';
    
      return (
        <Stack
          ref={ref}
          boxShadow='lg'
          borderRadius='sm'
          hidden={consent}
          bg={'brand.upGreen'}
          p={{ base: '5', md: '14', lg: '14' }}
          m={{ base: '5', md: '14', lg: '14' }}>
          <Stack direction='row' alignItems='center'>
            <Text fontWeight='semibold'>{t('consent.your_privacy')}</Text>
          </Stack>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            justifyContent='space-between'>
            <Text fontSize={{ base: 'md' }} textAlign={'left'} maxW={'4xl'}>
              {t('consent.privacy_policy_text')}{' '}
              <Link href={privacyPolicyUrl} color={'brand.purple'}>
                {t('consent.privacy_policy')}.
              </Link>
            </Text>
            <Stack>
              <Button onClick={acceptCookie} colorScheme='green'>
                {t('ok')}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      );
    }
    

 

Create Google Adsense & Google Analytics Script Injection Triggers and Google Analytics Component
-------------------------------------------------------------------------------------------------

We will create two functions, one of that for enable Google Analytics, one of that for enable Google Adsense. So we can trigger two operation. I store these on lib/Google/Google.tsx

    import Script from 'next/script';
    import { GOOGLE_ANALYTICS } from '../../configs/constants';
    
    export function enableGoogleAdsense() {
      const head = document.getElementsByTagName('head')[0];
      const scriptElement = document.createElement(`script`);
      scriptElement.type = `text/javascript`;
      scriptElement.async;
      scriptElement.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`;
      scriptElement.crossOrigin = 'anonymous';
      head.appendChild(scriptElement);
    }
    
    export function enableGoogleAnalytics() {
      const head = document.getElementsByTagName('head')[0];
      const scriptElement = document.createElement(`script`);
      scriptElement.type = `text/javascript`;
      scriptElement.async;
      scriptElement.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS}`;
      scriptElement.crossOrigin = 'anonymous';
      head.appendChild(scriptElement);
    }
    
    export function GoogleAnalytics() {
      return (
        <>
          <Script
            id='gtag-init'
            strategy='afterInteractive'
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            
              gtag('config', '${GOOGLE_ANALYTICS}', {
                page_path: window.location.pathname,
              });
            `,
            }}
          />
        </>
      );
    }
    

GOOGLE\_ANALYTICS variable comes from environment. You can pass hard coded to your own.

Create gtag Events
------------------

Create file on lib/Google/gtag.tsx

    import { GOOGLE_ANALYTICS } from '../../configs/constants';
    
    // https://developers.google.com/analytics/devguides/collection/gtagjs/pages
    export const pageview = (url) => {
      window.gtag('config', GOOGLE_ANALYTICS, {
        page_path: url,
      });
    };
    
    // https://developers.google.com/analytics/devguides/collection/gtagjs/events
    export const event = ({ action, params }) => {
      window.gtag('event', action, params);
    };
    

They will help to send event to Google Analytics like page view and changing route. We will use standard Next.js router events for making this. We can create search event, click event etc. on Google Analytics dashboard.

Put Your Google Analytics Component + events To \_app.tsx
---------------------------------------------------------

We should add GoogleAnalytics component to \_app.tsx file, so It works properly. But still doesn't load that script, It will load when user touch the screen or accept the consent.

    import { useRouter } from 'next/router';
    import { useEffect } from 'react';
    
    import { appWithTranslation } from 'next-i18next';
    import { ChakraProvider } from '@chakra-ui/react';
    
    import { GoogleAnalytics } from '../lib/Google/Google';
    import * as gtag from '../lib/Google/gtag';
    
    import Script from 'next/script.js';
    import { GOOGLE_ADSENSE, GOOGLE_ANALYTICS } from '../configs/constants';
    
    function MyApp({ Component, pageProps }) {
      const { locale, asPath, events } = useRouter();
      
      // Our events in useEffect
      useEffect(() => {
        const handleRouteChange = (url) => {
          gtag.pageview(url);
        };
        events.on('routeChangeComplete', handleRouteChange);
        events.on('hashChangeComplete', handleRouteChange);
        return () => {
          events.off('routeChangeComplete', handleRouteChange);
          events.off('hashChangeComplete', handleRouteChange);
        };
      }, [events]);
    
      return (
        <>
          // I'm here!
          <GoogleAnalytics />
          <Script
            dangerouslySetInnerHTML={{
              __html: `
          (adsbygoogle = window.adsbygoogle || []).push({
            google_ad_client: "${GOOGLE_ADSENSE}",
            enable_page_level_ads: true,
            overlays: { bottom: true },
          });
          `,
            }}
          />
          ...
            <ChakraProvider theme={theme}>
              <Component {...pageProps} />
            </ChakraProvider>
          )}
        </>
      );
    }
    
    export default appWithTranslation(MyApp, nextI18NextConfig);
    

Add Consent Component to App
----------------------------

Let's render Consent component on our layout:

    import { useRouter } from 'next/router';
    import dynamic from 'next/dynamic';
    
    import { Container, Flex, useColorModeValue } from '@chakra-ui/react';
    
    import { AdType, GoogleAdUnit } from '../GoogleAds/AdUnits';
    
    const DynamicHeader = dynamic(() => import('../header/Header'), {
      ssr: false,
    });
    const DynamicFooter = dynamic(() => import('../footer/Footer'), {
      ssr: false,
    });
    const DynamicScrollToTop = dynamic(() => import('../UI/ScrollToTop'), {
      ssr: false,
    });
    const DynamicConsent = dynamic(() => import('../sections/Consent'), {
      ssr: false,
    });
    
    const GlobalLayout = ({ children, pageContext, globalLayoutContext }) => {
      const { locale, asPath } = useRouter();
      const {
        navigation,
        layoutName,
      } = globalLayoutContext;
    
      return (
        <>
          <DynamicScrollToTop />
          <Flex
            as={'header'}
            align='center'
            pos='fixed'
            justify='center'
            boxSize='full'
            top='0'
            zIndex={99}
            bg={'brand.purple'}
            position='sticky'>
            <Container maxW={'7xl'}>
              <DynamicHeader alternatePages={alternatePages} header={header} />
            </Container>
          </Flex>
          <Container as={'main'} maxW={'6xl'} mt='5'>
            <main>{children}</main>
            <GoogleAdUnit variant={AdType.MULTIPLEX} />
            <br />
          </Container>
          <Flex bg={useColorModeValue('gray.50', 'gray.900')}>
            <Container as={'footer'} maxW={'6xl'}>
              <DynamicFooter footer={footer} relatedPaths={relatedPaths} />
            </Container>
          </Flex>
          <Flex
            align='center'
            pos='fixed'
            justify='center'
            bottom='0'
            zIndex={3}
            position='sticky'>
            <Container maxW={'6xl'} zIndex={199}>
            // I'am here!
              <DynamicConsent />
            </Container>
          </Flex>
        </>
      );
    };
    
    export default GlobalLayout;
    

Create Google Ad Units
----------------------

I will create one component and multiple ad type, so I can reuse them for all of ad units. Please change data-ad-slot numbers with yours.

    import { Stack } from '@chakra-ui/react';
    import { useEffect } from 'react';
    import { GOOGLE_ADSENSE, IS_DEVELOPMENT } from '../../configs/constants';
    
    export enum AdType {
      DEFAULT,
      ARTICLE,
      MULTIPLEX,
    }
    
    const adUnitProps = {
      [AdType.DEFAULT]: {
        'data-ad-slot': '123456789',
        'data-ad-format': 'auto',
        'data-full-width-responsive': 'true',
      },
      [AdType.ARTICLE]: {
        'data-ad-slot': '123456789',
        'data-ad-format': 'fluid',
        'data-ad-layout': 'in-article',
        'text-align': 'center',
      },
      [AdType.MULTIPLEX]: {
        'data-ad-slot': '123456789',
        'data-ad-format': 'autorelaxed',
        'data-full-width-responsive': 'true',
      },
    };
    
    export function GoogleAdUnit({ variant = AdType.DEFAULT }) {
      useEffect(() => {
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
          console.warn(err);
        }
      }, []);
    
      return (
        <>
          <Stack
            aria-hidden={true}
            style={{ minWidth: '300px', minHeight: '250px' }}>
            <ins
              className='adsbygoogle'
              style={{
                display: 'block',
                textAlign: variant == AdType.ARTICLE ? 'center' : 'unset',
              }}
              data-adtest={IS_DEVELOPMENT ? 'on' : 'off'}
              data-ad-client={GOOGLE_ADSENSE}
              {...adUnitProps[variant]}
            />
            <br />
          </Stack>
        </>
      );
    }
    

`data-adtest` variable is for preventing invalid clicks/displays for Google Ads. So Google can understand and ignore them. I will create three type of ad units: Default is Display Ad, multiplex and article is other ad formats.

Moving Top Of Anchor Ads to Bottom of The Page
----------------------------------------------

If you use sticky header or you want to keep visible your navbar, you can prevent anchor ads by coding. You can show at above, I add a script tag below <GoogleAnalytics /> component:

    <Script
            dangerouslySetInnerHTML={{
              __html: `
          (adsbygoogle = window.adsbygoogle || []).push({
            google_ad_client: "${GOOGLE_ADSENSE}",
            enable_page_level_ads: true,
            overlays: { bottom: true },
          });
          `,
            }}
          />

It will prevent top of ads without power-off complete auto anchor ads. So our logic is:

1.  Someone visits our web page.
2.  Our ad slots are already visible blank but not ads. We keep them for CLS score.
3.  Page is completely loaded.
4.  Click anywhere outside consent modal or accept privacy policy term on consent.
5.  Google Analytics and Google Ads scripts are loaded. So our auto ads and manual ads are visible! 🎉

It effects page speed 30% average on my projects. I hope It helps yours. Happy coding!