export function fakeImageGenerator(fakeImageUrl: string,delay: number) : Promise<string> {
   return new Promise((resolve) => {
        setTimeout(() => {
            resolve(fakeImageUrl);
        }, 1000 * delay);
    });
}

export function fakeMeshGenerator(fakeImageUrl: string,delay: number) : Promise<string> {
    return new Promise((resolve) => {
         setTimeout(() => {
             resolve(fakeImageUrl);
         }, 1000 * delay);
     });
 }