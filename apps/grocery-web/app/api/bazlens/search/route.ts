import {
  NextResponse
} from "next/server";


export const dynamic =
  "force-dynamic";


type PlatformResult = {
  title?: string;
  href?: string;
  slug?: string;
  image?: string;
  price?: string;
};


export async function POST(
  request: Request
) {
  const incoming =
    await request.formData();


  const image =
    incoming.get(
      "image"
    );


  if (
    !(image instanceof File)
  ) {
    return NextResponse.json(
      {
        error:
          "A product image is required."
      },
      {
        status:
          400
      }
    );
  }


  const apiBase =
    process.env.API_BASE_URL ??
    "http://127.0.0.1:4000";


  const outgoing =
    new FormData();


  outgoing.append(
    "image",
    image,
    image.name
  );


  try {
    const response =
      await fetch(
        `${apiBase}/v1/search/visual`,
        {
          method:
            "POST",

          body:
            outgoing,

          cache:
            "no-store"
        }
      );


    if (
      !response.ok
    ) {
      return NextResponse.json(
        {
          error:
            "BazLens visual matching is not enabled on the Platform API yet."
        },
        {
          status:
            response.status === 404
              ? 503
              : response.status
        }
      );
    }


    const payload =
      await response.json() as {
        results?: PlatformResult[];
      };


    const results =
      (
        payload.results ??
        []
      )
        .map(
          (
            result
          ) => {

            const href =
              result.href ??
              (
                result.slug
                  ? `/products/${result.slug}`
                  : ""
              );


            if (
              !href ||
              !result.title
            ) {
              return null;
            }


            return {
              title:
                result.title,

              href,

              image:
                result.image,

              price:
                result.price
            };
          }
        )
        .filter(
          (
            result
          ): result is {
            title: string;
            href: string;
            image: string | undefined;
            price: string | undefined;
          } =>
            result !==
            null
        );


    return NextResponse.json(
      {
        results
      }
    );
  }
  catch {
    return NextResponse.json(
      {
        error:
          "BazLens could not reach the Platform API visual-search service."
      },
      {
        status:
          503
      }
    );
  }
}
