

import fs from 'fs'
import { getChallenges } from '@freecodecamp/curriculum'

const allChallengeBlocks = getChallenges()

fs.writeFileSync('challenge-bundle.json', JSON.stringify(allChallengeBlocks))
 
import { GraphQLClient } from 'graphql-request'

const client = new GraphQLClient('http://localhost:4466')

const mutation = `mutation createCompetency(
    $title: String!, 
    $description: String,
    $sourceId: String,
    $bloomCategory: BloomCategoryCreateOneInput,
    $tags: TagCreateManyInput!,
    $owner: UserCreateOneInput!,
    $resources: ResourceCreateManyWithoutCompetencyInput,
  $endorsements: EndorsementCreateManyWithoutCompetencyInput) {
    createCompetency(
        data: {
            title: $title
            description: $description
            sourceId: $sourceId
            bloomCategory: $bloomCategory
            tags: $tags
            owner: $owner
            resources: $resources
            endorsements: $endorsements
            }
          )
    {
        id
        title
    }
}`

const blocksToCapture = [
  'responsive-web-design'  ,
  'javascript-algorithms-and-data-structures',
  'front-end-libraries',
  'data-visualization',
  'apis-and-microservices',
  'information-security-and-quality-assurance' 
]

const selectBlocks = allChallengeBlocks.filter(block =>
  blocksToCapture.find(element => element === block.superBlock)
)

console.log('Number of blocks: ' + selectBlocks.length)

let count = 0
let tagArray = []
async function main() {
  for (let block of selectBlocks) {
    const superOrder = block.superOrder
    const order = block.order
    const category = block.superBlock
    let hyphenName = block.name.replace(/\s/g, '-').toLowerCase()
    let spacedCategory = category.replace(/-/g, ' ').toLowerCase()
    const resourceURL = `https://learn.freecodecamp.org/${category}/${hyphenName}/`
    const tagName = block.name
    console.log(`${superOrder}    ${category}    ${hyphenName}    ${spacedCategory}    ${tagName}   ${order}`)
    for (let challenge of block.challenges) {
      const ownerEmail = 'admin@freecodecamp.org'
      let level = 'INFO'
      let icon = 'info'
      if (challenge.challengeType) {
        switch (challenge.challengeType) {
        case 0:
        case 1:
        case 2:
        case 5:
        case 6:
          level = 'APPLY' // Revised Bloom's APPLY
          icon = 'build'
          break
        case 3:
        case 4:
        case 7:
          level = 'CREATE' // Revised Bloom's CREATE
          icon = 'create'
          break
        default:
          level = 'REMEMBER' // Revised Bloom's REMEMBER
          icon = 'book'
          break
        }
      }
      let tagObject = {}
      if (tagArray.includes(tagName)) {
        console.log(`It appears ${tagName} is already in the array - ${tagArray}.`)
        // we already encountered this competency tag, so just connect
        // to it by using it's unique name.
        tagObject = {
          connect: {
            name: tagName
          }
        }
      } else {
        // console.log(`It appears ${tagName} is not in the array.`)
        // this one is new, so create
        console.log(`Creating new tag with name ${tagName}`)
        tagObject = {
          create: {
            name: tagName,
            conceptualCategory: {
              create: {
                name: category,
                owner: {
                  connect: {
                    email: 'admin@freecodecamp.org'
                  }
                }
              }
            },
            orderWithinCategory: order,
            owner: {
              connect: {
                email: 'admin@freecodecamp.org'
              }
            }
          }
        }
        tagArray.push(tagName)
      }
      count++

      let fullURL = resourceURL + challenge.title.replace(/\s/g, '-')
        .toLowerCase()
      let variables = {
        title: challenge.title,
        sourceId: challenge.id,
        bloomCategory: {
          create: {
            level: level,
            icon: icon
          }
        },
        tags: tagObject,
        owner: {
          connect: {
            email: ownerEmail
          }
        },
        resources: {
          create: {
            description: challenge.description.join('\n'),
            url: fullURL,
            owner: {
              connect: {
                email: ownerEmail
              }
            }
          }
        },
        endorsements: {
          create: {
            owner: {
              connect: {
                email: ownerEmail
              }
            }
          }
        }
      }
      await client
        .request(mutation, variables)
        .then(data => console.log(data))
        .catch(err => console.log(`${err} ${count}`))
    }
  }
}

main()