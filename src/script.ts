import {Link, PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

export const getAllLinks = async () => {
    const allLinks = await prisma.link.findMany();
    console.log(`*** Getting all the links from the DB:`);
    console.log(allLinks);
    console.log(`Yaas man ***`);
}

export const getALink = async (id: number) => {
    const singleLink = await prisma.link.findUnique({
        where: {
            id : id
        }
    });
    console.log(`*** Getting A SINGLE link from the DB - id = ${id}`);
    console.log(singleLink);
    console.log(`Yaas man ***`);
}

// note 'url' is not unique, so now just get the first one....
export const getALinkWithUrl = async (url: string): Promise<Link> => {
    const singleLink = await prisma.link.findFirst({
        where: {
            url : url
        }
    });
    console.log(`*** Getting A SINGLE link WITH A URL from the DB - url = ${url}`);
    console.log(singleLink);
    console.log(`Yaas man ***`);
    return singleLink
}

export const addNewLink = async (url: string, description: string) => {
    const newLink = await prisma.link.create({
        data: {
            description,
            url
        },
    });
    console.log(`*** Adding a new Link (${url} - ${description})`);
    console.log(`newLink = ${JSON.stringify(newLink)})`);
}

export const deleteLink = async (id: number) => {
    console.log(`*** Deleting a Link - ID = ${id}`);
    try {
        const deletedLink = await prisma.link.delete({
            where: {
                id: id
            },
        });
        console.log(`deletedLink = ${JSON.stringify(deletedLink)})`);
    } catch (e){
        console.log(`Unable to delete this because it doesn't exist: ${e}`)
    }
}

async function main() {
    // all of my queries will go in here

    // await addNewLink("www.howtographql.com", "Fullstack tutorial for GraphQL");
    // await addNewLink("www.bbc.co.uk", "A BBC thing");
    // await addNewLink("www.nice-cats.com", "dunno *who* put this here");

    // await deleteLink(3);
    // await deleteLink(4);

    const myUrl = "www.wiggly.woggly.com";
    await addNewLink(myUrl, "A nice site about insects");
    const wigglyLink = await getALinkWithUrl(myUrl);
    await getALink(wigglyLink.id);
    await deleteLink(wigglyLink.id);

    await getAllLinks();
}

main()
    .catch((e) => {
        throw e;
    })
    // 5
    .finally(async () => {
        await prisma.$disconnect();
    });