import * as cdk from '@aws-cdk/core';
import { CodePipeline, CodePipelineSource, ShellStep } from '@aws-cdk/pipelines';
import { MyPipelineAppStage } from './my-pipeline-app-stage';
import { CodeStarConnectionPipeline } from './codestar-pipeline';
import { Bucket } from "@aws-cdk/aws-s3";
import { CodeStarConnectionDef } from './sourcedef';

export class CdkPipelineExampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const connectionArn = "arn:aws:codestar-connections:us-east-1:025257542471:connection/b53232ef-36cd-40e2-90ce-4bed059aed57";

    // Define the underlying CodePipeline
    const bucket = new Bucket(this, 'PipelineBucket');
    const sourceInfo = new CodeStarConnectionDef({
      codeStarConnection: connectionArn,
      repoOwner: "MasterOfTheBus",
      repo: "test_lambda_deploy"
    });
    const codestarPipeline = new CodeStarConnectionPipeline(this, 'CodeStarPipeline', {
      deployBucket: bucket,
      primarySourceInfo: sourceInfo
    })

    // The code that defines your stack goes here
    const pipeline = new CodePipeline(this, 'Pipeline', {
      codePipeline: codestarPipeline.pipeline,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection('MasterOfTheBus/cdk-pipeline-example', 'main', {
          connectionArn: connectionArn
        }),
        commands: ['npm ci', 'npm run build', 'npx cdk synth']
      })
    });

    pipeline.addStage(new MyPipelineAppStage(this, "test", {
      bucket: bucket,
      s3Artifact: codestarPipeline.outputArtifact,
      stageProps: {
        env: { account: "025257542471", region: "us-east-1" }
      }
    }));
  }
}
