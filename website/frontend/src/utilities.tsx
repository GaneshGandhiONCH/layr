import {jsx, useTheme} from '@emotion/react';
import {useWindowHeight} from '@react-hook/window-size';
import {Helmet} from 'react-helmet';

import {InlineMarkdown} from './markdown';

export function FullHeight({
  id,
  className,
  children
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const height = useWindowHeight({initialHeight: 600});

  return (
    <div id={id} className={className} css={{minHeight: height}}>
      {children}
    </div>
  );
}

export function FeatureSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <div
      css={theme.responsive({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: ['3rem 1.5rem', , '3rem 15px']
      })}
    >
      <div css={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <h3
          css={theme.responsive({
            fontSize: [, , '1.563rem'],
            textAlign: 'center'
          })}
        >
          {title}
        </h3>
        <div
          css={theme.responsive({
            fontSize: ['1.25rem', , '1rem'],
            color: theme.colors.text.muted,
            textAlign: 'center'
          })}
        >
          <InlineMarkdown>{description}</InlineMarkdown>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Title({children: title}: {children?: string}) {
  if (title === undefined) {
    title = 'Layr';
  } else {
    title = 'Layr – ' + title;
  }

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
}
